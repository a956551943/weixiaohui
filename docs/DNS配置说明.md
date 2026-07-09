# 自定义域名 DNS 配置说明

域名：**hanyunnn.com**  
GitHub 仓库：**a956551943/weixiaohui**  
Pages 默认地址：https://a956551943.github.io/weixiaohui/

---

## 错误原因

`InvalidDNSError` = GitHub 查不到指向它的 DNS 记录。  
当前 `hanyunnn.com` **未配置** GitHub Pages 要求的 A 记录 / CNAME。

---

## 在域名服务商处添加（最小配置）

登录购买 **hanyunnn.com** 的平台（阿里云 / 腾讯云 / Cloudflare 等），在 DNS 解析里添加：

### 根域名 hanyunnn.com（4 条 A 记录，都要加）

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |

### 子域名 www.hanyunnn.com（1 条 CNAME）

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | www | `a956551943.github.io` |

> CNAME 目标末尾 **不要** 加 `/`，不要写成 `a956551943.github.io/weixiaohui`

---

## 若使用 Cloudflare

- A / CNAME 记录旁云朵设为 **灰色（DNS only）**，不要橙色代理
- 否则 GitHub 无法验证，HTTPS 证书也可能失败

---

## GitHub 侧设置

1. https://github.com/a956551943/weixiaohui/settings/pages  
2. **Custom domain** 填：`hanyunnn.com`  
3. 勾选 **Enforce HTTPS**（DNS 生效后约 10 分钟～24 小时可用）  
4. 若仍报错：点 **Remove** 删除域名 → 等 5 分钟 → 重新填入 → **Save**

仓库 `docs/CNAME` 文件内容应为：`hanyunnn.com`（已添加）

---

## 生效时间

- DNS 修改后通常 **10 分钟～48 小时** 全球生效  
- GitHub Pages 显示绿色勾后，访问：https://hanyunnn.com  

---

## 暂时不想配 DNS

可直接用（无需自定义域名）：

**https://a956551943.github.io/weixiaohui/**

确保 Pages 已开启：Settings → Pages → Branch `master` → Folder `/docs`

---

## 验证 DNS 是否配好

在终端执行（或在 https://dnschecker.org 查询）：

```bash
dig hanyunnn.com A +short
# 应返回 185.199.108.153 等 4 个 IP 之一

dig www.hanyunnn.com CNAME +short
# 应返回 a956551943.github.io.
```
