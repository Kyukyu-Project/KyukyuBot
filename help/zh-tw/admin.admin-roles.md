`?admin-roles`

查看、添加、或刪除管理員身分組。

具有管理員角色的用戶可以
- 使用任何機器人指令時無冷卻時間，
- 使用 `say` 和 `reply` 指令
- 管理管理員、版主、和助手身分組

**別名**
*  `?admin-role`
*  `?administrator-roles`
*  `?administrator-role`

**用法**
* `?admin-roles [--info]`
* `?admin-roles --add <role-mention|role-id*...`
* `?admin-roles --remove <role-mention|role-id*...`
* `?admin-roles --clear`

**選項**
* `-i, --info       `顯示版主身分組清單(預設) 
* `-a, --add, +     `將身分組添加到版主身分組清單
* `-r, --remove, -  `將身分組從版主身分組清單移除
* `-c, --clear      `清除（重置）版主身分組清單

**範例**
* `?admin-roles --add @admin @feedback-team`
* `?admin-roles --add 658601635643392061`
* `?admin-roles + @admin`
* `?admin-roles --remove @trusted`

**相關指令**
* `?mod-roles`
* `?helper-roles`
