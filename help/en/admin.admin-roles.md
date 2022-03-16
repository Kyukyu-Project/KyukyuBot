`?admin-roles`

*View, add, or remove the administrator roles.*

*A users with a administrator role can*
- *use bot commands without any cool-down,*
- *use `say` and `reply` commands*
- *manage admin, moderator, and helper roles*

**Aliases**
*  `?admin-role`
*  `?administrator-roles`
*  `?administrator-role`

**Usages**
* `?admin-roles [--info]`
* `?admin-roles --add <role-mention|role-id*...`
* `?admin-roles --remove <role-mention|role-id*...`
* `?admin-roles --clear`

**Options**
* `-i, --info         `Show the list of moderator roles (Default) 
* `-a, --add, +       `Add role(s) to the list of moderator roles
* `-r, --remove, -    `Remove role(s) from the list of moderator roles
* `-c, --clear        `Clear (reset) the list of moderator roles

**Examples**
* `?admin-roles --add @admin @feedback-team`
* `?admin-roles --add 658601635643392061`
* `?admin-roles + @admin`
* `?admin-roles --remove @trusted`

**Related**
* `?mod-roles`
* `?helper-roles`
