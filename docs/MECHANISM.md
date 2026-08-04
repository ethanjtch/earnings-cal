# 项目运行机制说明 (Project Mechanism Description)

此文档收录项目运行机制的中英文说明，用于后续需要时加入网页或文档中。

---

## 中文版

### 标题
运行机制

### 正文
本项目每日自动从 Nasdaq 获取美股未来 30 天的财报发布日数据，每周从 Wikipedia 自动更新纳斯达克 100、标普 500 及道琼斯 30 的成份股列表。通过 GitHub Actions 定时构建并生成标准 `.ics` 日历订阅源，支持 Apple 日历、Google 日历及 Outlook 实时同步，无需手动维护。

---

## 英文版 (English Version)

### Heading
How it works

### Text
Automatically fetches upcoming 30-day US stock earnings dates from Nasdaq daily and updates index constituents weekly. Powered by GitHub Actions, it generates standard `.ics` calendar feeds compatible with Apple Calendar, Google Calendar, and Outlook.
