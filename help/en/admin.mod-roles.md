`?mod-roles`

*View, add, or remove the moderator roles.*

*A users with a moderator role can*
- *use bot commands without any cool-down,*
- *use `say` and `reply` commands*

**Aliases**
*  `?mod-role`
*  `?moderator-role`
*  `?moderator-roles`

**Usages**
* `?mod-roles [--info]`
* `?mod-roles --add <role-mention|role-id*...`
* `?mod-roles --remove <role-mention|role-id*...`
* `?mod-roles --clear`

**Options**
* `-i, --info         `Show the list of moderator roles (Default) 
* `-a, --add, +       `Add role(s) to the list of moderator roles
* `-r, --remove, -    `Remove role(s) from the list of moderator roles
* `-c, --clear        `Clear (reset) the list of moderator roles

**Examples**
* `?mod-roles --add @moderator @admin`
* `?mod-roles --add 658601635643392061`
* `?mod-roles + @moderator`
* `?mod-roles --remove @trusted`

**Related**
* `?admin-roles`
* `?helper-roles`
