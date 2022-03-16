`?helper-roles`

*View, add, or remove the helper roles*

*A users with a moderator role can*
- *use bot commands without any cool-down*

**Aliases**
*  `?helper-role`

**Usages**
* `?helper-roles [--info]`
* `?helper-roles --add <role-mention|role-id*...`
* `?helper-roles --remove <role-mention|role-id*...`
* `?helper-roles --clear`

**Options**
* `-i, --info         `Show the list of helper roles (Default) 
* `-a, --add, +       `Add role(s) to the list of helper roles
* `-r, --remove, -    `Remove role(s) from the list of helper roles
* `-c, --clear        `Clear (reset) the list of helper roles

**Examples**
* `?helper-roles --add @helper @admin`
* `?helper-roles --add 658601635643392061`
* `?helper-roles + @helper`
* `?helper-roles --remove @trusted`

**Related**
* `?moderator-roles`
