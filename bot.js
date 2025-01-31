
import axios from 'axios';
import chalk from 'chalk';
import figlet from 'figlet';
import Web3 from 'web3';
import fs from 'fs/promises';
import Table from 'cli-table3';
import gradient from 'gradient-string';
import logUpdate from 'log-update';

// 禁用Node.js弃用警告
process.env.NODE_NO_WARNINGS = '1';

// ====================
// 终端样式系统
// ====================
const 输出样式 = {
  分隔线: chalk.hex('#2A2A2A')('━'.repeat(50)),
  小分隔线: chalk.gray('─'.repeat(50)),
  状态图标: {
    成功: chalk.green('✅'),
    警告: chalk.yellow('⚠️'),
    错误: chalk.red('❌'),
    进度: chalk.cyan('⏳')
  },
  颜色主题: {
    地址: chalk.hex('#7ED8F8'),
    数值: chalk.hex('#FFD700'),
    时间: chalk.hex('#A9A9A9'),
    强调: chalk.hex('#00FF88'),
    次要: chalk.gray
  }
};

// ====================
// 配置管理中心
// ====================
const 系统配置 = {
  网络设置: {
    RPC节点: 'https://sepolia.infura.io',
    API地址: 'https://dapp-backend-large.fractionai.xyz',
    链ID: 11155111
  },
  业务参数: {
    推荐码: '28E4C6D8',
    入场费用: 0.01,
    会话类型: 1
  },
  运行控制: {
    循环间隔: 1200000,   
    请求间隔: 2000,       
    最大时间偏差: 300000  
  },
  调试模式: false
};

// ====================
// 可视化模块
// ====================
function 显示标题() {
  const titleGradient = gradient(['#00FF88', '#00D8FF', '#0066FF']);
  console.log(
    titleGradient(
      figlet.textSync('空投系统', {
        font: 'Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
 console.log(
  chalk.bgHex('#1A1A1A').hex('#00FF88')(' 加入我们：电报频道：https://t.me/ksqxszq ') +
  输出样式.颜色主题.数值('  v2.1.0') +
  '\n' +
  chalk.hex('#2A2A2A')('━'.repeat(50)) + '\n' +
  chalk.hex('#00FF88')('推特：@qklxsqf') + '\n' +
  chalk.hex('#2A2A2A')('━'.repeat(50))
);
  console.log(输出样式.颜色主题.时间(
    `启动于 ${new Date().toLocaleString('zh-CN', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`
  ));
  console.log(输出样式.分隔线 + '\n');
}

const 延迟 = (毫秒) => new Promise(resolve => setTimeout(resolve, 毫秒));

function 生成倒计时条(剩余时间, 总时间) {
  const 进度百分比 = Math.min(1, Math.max(0, 剩余时间 / 总时间));
  return 输出样式.颜色主题.强调(
    '⏳ ' +
    chalk.hex('#FFAA33')(
      `[${'█'.repeat(Math.round(25 * (1 - 进度百分比)))}${'░'.repeat(25 - Math.round(25 * (1 - 进度百分比)))}] `
    ) +
    `${Math.ceil(剩余时间 / 1000)}秒`
  );
}

// ====================
// 钱包管理模块
// ====================
async function 加载钱包文件() {
  try {
    const 原始数据 = await fs.readFile('wallet.txt', 'utf-8');
    const 钱包列表 = 原始数据
      .split('\n')
      .map(行 => 行.trim())
      .filter(私钥 => {
        const 有效格式 = /^(0x)?[a-fA-F0-9]{64}$/.test(私钥);
        if (!有效格式 && 系统配置.调试模式) {
          console.log(输出样式.状态图标.警告 + ' ' + chalk.yellow(`无效私钥：${私钥.slice(0, 8)}...`));
        }
        return 有效格式;
      });

    console.log(
      输出样式.状态图标.成功 +
      chalk.cyan(` 加载完成 · 有效钱包 `) +
      chalk.bgHex('#2C3E50').bold(` ${钱包列表.length} `)
    );
    return 钱包列表;
  } catch (错误) {
    console.log(输出样式.状态图标.错误 + ' ' + chalk.red('钱包文件加载失败：'), 错误.message);
    process.exit(1);
  }
}

// ====================
// 区块链认证模块
// ====================
class 区块链认证器 {
  constructor() {
    this.web3 = new Web3(系统配置.网络设置.RPC节点);
  }

  async 执行认证流程(私钥) {
    try {
      if (系统配置.调试模式) {
        console.log(输出样式.颜色主题.次要(`[调试] 原始私钥: ${私钥.slice(0, 8)}...`));
      }

      const 时间偏差 = await this.验证时间同步();
      if (时间偏差 > 系统配置.运行控制.最大时间偏差) {
        console.log(输出样式.状态图标.错误 + ' ' + chalk.red('系统时间不同步！偏差：'), 
          `${Math.round(时间偏差 / 1000)}秒`);
        return null;
      }

      const 格式化私钥 = 私钥.startsWith('0x') ? 私钥 : `0x${私钥}`;
      const 钱包账户 = this.web3.eth.accounts.privateKeyToAccount(格式化私钥);

      const 随机数响应 = await axios.get(`${系统配置.网络设置.API地址}/api3/auth/nonce`);
      const 签发时间 = new Date().toISOString();

      const 签名消息 = `dapp.fractionai.xyz wants you to sign in with your Ethereum account:
${钱包账户.address}

Sign in to access Fraction AI services.

URI: https://dapp.fractionai.xyz
Version: 1
Chain ID: ${系统配置.网络设置.链ID}
Nonce: ${随机数响应.data.nonce}
Issued At: ${签发时间}`;

      const 签名结果 = this.web3.eth.accounts.sign(签名消息, 格式化私钥);

      if (系统配置.调试模式) {
        console.log(chalk.gray('[调试] 签名消息：\n'), 签名消息);
        console.log(chalk.gray('[调试] 生成签名：'), 签名结果.signature);
      }

      const 认证响应 = await axios.post(
        `${系统配置.网络设置.API地址}/api3/auth/verify`,
        {
          message: 签名消息,
          signature: 签名结果.signature,
          referralCode: 系统配置.业务参数.推荐码
        },
        { timeout: 10000 }
      );

      console.log(
        输出样式.状态图标.成功 +
        chalk.bgHex('#1E4D2B').hex('#00FF88').bold(' ✔ 认证成功 ') +
        ` ${输出样式.颜色主题.地址(钱包账户.address.slice(0,6)+'...'+钱包账户.address.slice(-4))}` +
        输出样式.颜色主题.次要(` · 积分: `) +
        输出样式.颜色主题.数值(`${认证响应.data.user.fractal} FRACT`)
      );

      return {
        访问令牌: 认证响应.data.accessToken,
        用户信息: 认证响应.data.user,
        钱包地址: 钱包账户.address
      };
    } catch (错误) {
      this.处理认证错误(错误);
      return null;
    }
  }

  async 验证时间同步() {
    try {
      const 响应 = await axios.head(系统配置.网络设置.API地址);
      const 服务器时间 = new Date(响应.headers.date).getTime();
      return Math.abs(Date.now() - 服务器时间);
    } catch {
      return 0; 
    }
  }

  处理认证错误(错误) {
    const 错误状态 = 错误.response?.status;
    const 错误信息 = 错误.response?.data?.error || 错误.message;
    
    const 错误映射 = {
      400: '请求参数错误',
      401: '签名验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误'
    };

    console.log(chalk.red('认证失败：'), 
      错误映射[错误状态] || '未知错误',
      chalk.gray(`(${错误信息})`)
    );
  }
}

// ====================
// 代理管理模块
// ====================
class 代理管理器 {
  static async 获取代理信息(访问令牌, 用户ID) {
    try {
      const 响应 = await axios.get(
        `${系统配置.网络设置.API地址}/api3/agents/user/${用户ID}`,
        { 
          headers: { 
            Authorization: `Bearer ${访问令牌}`,
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        }
      );
      
      return 响应.data.map(代理 => ({
        唯一标识: 代理.id,
        代理名称: 代理.name,
        创建时间: new Date(代理.createdAt),
        运行状态: this.解析代理状态(代理.status)
      }));
    } catch (错误) {
      console.log(输出样式.状态图标.警告 + ' ' + chalk.yellow('代理信息获取失败：'), 
        错误.response?.data?.error || 错误.message
      );
      return [];
    }
  }

  static 解析代理状态(状态码) {
    const 状态映射 = {
      0: '❌ 离线',
      1: '⏳ 待机',
      2: '✅ 运行中'
    };
    return 状态映射[状态码] || '❓ 未知状态';
  }

  static 美化代理列表(代理列表) {
    console.log(输出样式.状态图标.进度 + chalk.cyan.bold(' 代理状态看板 '));
    代理列表.forEach((代理, 序号) => {
      const 状态颜色 = {
        '❌ 离线': chalk.red,
        '⏳ 待机': chalk.yellow,
        '✅ 运行中': chalk.green,
        '❓ 未知状态': chalk.gray
      }[代理.运行状态] || chalk.gray;
      
      console.log(
        ` ${chalk.gray('┝')} ${chalk.bold(`#${序号 + 1}`)} ` +
        `${chalk.cyan(代理.代理名称.padEnd(24))} ` +
        `${状态颜色(`[${代理.运行状态}]`)} ` +
        输出样式.颜色主题.时间(`创建于 ${代理.创建时间.toLocaleDateString('zh-CN')}`)
      );
    });
    console.log(输出样式.小分隔线);
  }
}

// ====================
// 主业务流程
// ====================
async function 处理单个钱包(私钥, 序号, 总数) {
  const 认证服务 = new 区块链认证器();
  
  logUpdate(`\n${生成倒计时条(系统配置.运行控制.循环间隔, 系统配置.运行控制.循环间隔)}\n` +
    gradient.rainbow(`  正在处理钱包 ${序号 + 1}/${总数}...`)
  );

  const 认证结果 = await 认证服务.执行认证流程(私钥);
  if (!认证结果) return;

  const 代理列表 = await 代理管理器.获取代理信息(
    认证结果.访问令牌,
    认证结果.用户信息.id
  );

  // 构建表格数据
  const 表格数据 = [{
    序号: 输出样式.颜色主题.数值(`#${序号 + 1}`),
    地址: 输出样式.颜色主题.地址(`${认证结果.钱包地址.slice(0,6)}...${认证结果.钱包地址.slice(-4)}`),
    代理数: 代理列表.length > 0 ? chalk.green(代理列表.length) : chalk.red('×'),
    积分: 输出样式.颜色主题.数值(`✦${认证结果.用户信息.fractal}`),
    状态: 代理列表.length > 0 ? chalk.bgGreen.black(' ✅ ONLINE ') : chalk.bgRed.black(' ❌ OFFLINE ')
  }];

  const 表格 = new Table({
    head: [
      chalk.hex('#00FFEE')('🆔 序号'),
      gradient.morning('📭 钱包地址'),
      chalk.hex('#FF9966')('🤖 代理数量'),
      chalk.hex('#FF44CC')('🪙 积分'),
      gradient.passion('🌐 运行状态')
    ],
    colWidths: [10, 30, 15, 15, 20], 
    colAligns: ['left', 'left', 'right', 'right', 'left'],
    wordWrap: true, 
    style: {
      head: [], 
      border: [] 
    }
  });

  表格数据.forEach(row => {
    表格.push([
      row.序号,
      row.地址,
      row.代理数,
      row.积分,
      row.状态
    ]);
  });

  console.log(表格.toString());

  if (代理列表.length > 0) {
    代理管理器.美化代理列表(代理列表);
    await 执行空间加入流程(认证结果, 代理列表);
  }
}

async function 执行空间加入流程(认证结果, 代理列表) {
  for (const 代理 of 代理列表) {
    try {
      const 响应 = await axios.post(
        `${系统配置.网络设置.API地址}/api3/matchmaking/initiate`,
        {
          userId: 认证结果.用户信息.id,
          agentId: 代理.唯一标识,
          entryFees: 系统配置.业务参数.入场费用,
          sessionTypeId: 系统配置.业务参数.会话类型
        },
        { 
          headers: { 
            Authorization: `Bearer ${认证结果.访问令牌}`,
            'X-Request-ID': Date.now().toString()
          },
          timeout: 10000
        }
      );

      if (响应.status === 200) {
        console.log(
          ` ${输出样式.状态图标.成功} ` +
          chalk.cyan('✔ 成功加入空间 ') +
          输出样式.颜色主题.地址(代理.代理名称)
        );
        await 延迟(系统配置.运行控制.请求间隔);
      }
    } catch (错误) {
      const 错误详情 = 错误.response?.data?.error || '未知错误';
      console.log(
        ` ${输出样式.状态图标.错误} ` +
        chalk.red('⚠ 加入失败 ') +
        输出样式.颜色主题.地址(代理.代理名称) +
        输出样式.颜色主题.次要(' · ') +
        chalk.hex('#FFA500')(错误详情)
      );
    }
  }
}

// ====================
// 主流程控制
// ====================
async function 主流程() {
  显示标题();
  
  try {
    const 钱包列表 = await 加载钱包文件();
    let 循环次数 = 1;
    
    while (true) {
        console.clear(); 
      显示标题(); 
      
      console.log(输出样式.颜色主题.强调(`\n🌀 开始第 ${循环次数} 轮循环\n`));
      
      for (const [索引, 私钥] of 钱包列表.entries()) {
        await 处理单个钱包(私钥, 索引, 钱包列表.length);
        await 延迟(5000);
      }

      let 剩余时间 = 系统配置.运行控制.循环间隔;
      const 倒计时间隔 = setInterval(() => {
        剩余时间 -= 1000;
        logUpdate(`\n${生成倒计时条(剩余时间, 系统配置.运行控制.循环间隔)}\n` +
          gradient.passion(`  下一轮循环将在 ${Math.ceil(剩余时间/1000)} 秒后开始...`)
        );
        if (剩余时间 <= 0) clearInterval(倒计时间隔);
      }, 1000);

      await 延迟(系统配置.运行控制.循环间隔);
      循环次数++;
      
      console.log(
        `\n${输出样式.状态图标.进度} ` +
        输出样式.颜色主题.强调(`下次循环于 `) +
        输出样式.颜色主题.时间(`${(系统配置.运行控制.循环间隔 / 60000).toFixed(2)} 分钟`) +
        输出样式.颜色主题.强调(` 后开始 `) +
        输出样式.颜色主题.次要('[按 Ctrl+C 终止]')
      );
    }
  } catch (错误) {
    console.log(chalk.bgRed.white.bold(` ‼ 系统错误: ${错误.message} `));
    process.exit(1);
  }
}

// 启动系统
主流程();
