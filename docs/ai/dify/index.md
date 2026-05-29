## 清空用户注册信息

```sql
delete from tenant_account_joins where 1=1;
delete from tenants where name='alterman''s Workspace';
delete from accounts where  name='alterman';
delete from dify_setups where version='1.10.1';

truncate table tenant_account_joins;
truncate table tenants;
truncate table accounts;
truncate table dify_setups;
```

```bash

export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890
docker rm -f $(docker ps -aq)

git clone git@git.citydo.com.cn:ksh/dify.git
cd dify
git checkout dev/1.0.0
cd docker
cp .env.example .env
docker compose up -d
sudo chown -R 1001:1001 ./volumes
sudo chmod -R 755 ./volumes

```

## 差价安装流程

1. 用于根据插件 ID 列表获取插件的安装信息
   /console/api/workspaces/current/plugin/list/installations/ids
   内部调用 plugin-daemon plugin/0b7f485a-4c47-4aa1-b113-4a18462d122d/management/installation/fetch/batch
2. 获取市场插件的包信息（manifest），包括插件的元数据、版本信息、依赖关系等
   /console/api/workspaces/current/plugin/marketplace/pkg
   内部调用 plugin-daemon plugin/{tenant_id}/management/fetch/manifest
3. 安装
   /console/api/workspaces/current/plugin/install/marketplace

- get "plugin/{tenant_id}/management/fetch/manifest"
- get "plugin/{tenant_id}/management/decode/from_identifier"
  内部调用 DecodePluginFromIdentifier
  pkg = download_plugin_pkg(plugin_unique_identifier) 下载插件
- post plugin/{tenant_id}/management/install/upload/package 上传插件

- post "plugin/{tenant_id}/management/install/identifiers"
  内部调用 InstallPluginFromIdentifiers
