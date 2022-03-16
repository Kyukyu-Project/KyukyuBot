`?bot-channel`

*View, set, or reset the bot-command channel.*

*In the bot-command channel, everyone can use commands without any cool-down.*

**Aliases**
*  `?bot-channels`

**Usages**
* `?bot-channel [--info]`
* `?bot-channel --set <channel-mention|channel-id>`
* `?bot-channel --clear`

**Options**
* `-i, --info         `Show the bot-command channel (Default) 
* `-s, --set          `Set the bot-command channel
* `-c, --clear        `Clear (reset) the bot-command channel

**Examples**
* `?bot-channel -i`
* `?bot-channel --set #bot-commands`
* `?bot-channel -s #bot-commands`
* `?bot-channel --clear`
