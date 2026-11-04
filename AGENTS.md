# 项目协作约定

- 用户要求：每次修改完成后，都需要发布，不要只完成本地修改。
- 发布前运行项目检查：`node --check app.js`、`node --test tests/*.test.cjs`、`npm test --prefix games/gibberers`。
- 将修改提交并推送到 `origin/main`，触发 `.github/workflows/pages.yml` 的 GitHub Pages 发布流程。
- 推送后检查部署结果及线上内容；确认发布成功后再报告完成。若发布失败或受权限、网络限制，说明具体阻碍，不要将仅本地完成或仅推送成功称为已发布。
- 线上地址：https://feng-master.github.io/boardgamehelper/
