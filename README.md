# Fraction AI Bot

一个基于 Node.js 和 Web3 的终端工具，结合了多个依赖库（如 `axios`, `chalk`, `figlet`, `Web3` 等），用于与以太坊网络交互并进行任务管理。

## 功能

- 通过 `Web3` 与以太坊网络进行交互。
- 在终端中使用 `chalk` 和 `figlet` 显示漂亮的样式和 ASCII 艺术。
- 使用 `cli-table3` 显示任务表格。
- 支持配置和网络设置的管理。

## 环境要求

- Node.js >= 14.x.x
- npm 或 yarn

Sight Ai 激励测试网
Fraction AI Testnet (SEPOLIA)



链接：https://dapp.fractionai.xyz/?referral=28E4C6D8

操作步骤：

使用 Metamask 连接（建议使用一次性账户/BURNER WALLET）。

进入 Dashboard 页面。

点击 "+ Create New Agent" 创建新代理。

使用 AI 填写描述信息。

进入 "My Agents" 页面。

点击 "Enable Automation" 启用自动化。

✅ 完成！

如果需要购买 Sepolia 测试网 $ETH：

点击此处购买 (https://testnetbridge.com/sepolia)

注意事项：

此测试网需要大量的 $ETH（Sepolia 测试网），因为代理战斗会依赖你的 $ETH 余额。

## 安装

首先克隆仓库：

```bash
git clone https://github.com/ziqing888/fraction-ai-bot.git
cd fraction-ai-bot
```

安装依赖：
```bash
npm install axios chalk figlet web3 cli-table3 gradient-string log-update
```
在 wallet.txt 上输入私钥钱包 0x开头示例：
```bash
0x123456789
```
运行
安装完成后，可以使用以下命令启动项目：
```bash
node bot.js
```
