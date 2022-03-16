`?bot-channel`

顯示或是設置機器人指令頻道。

在機器人指令頻道中，每個人都可以使用指令而無需任何冷卻時間。

**別名**
*  `?bot-channels`

**用法**
* `?bot-channel [--info]`
* `?bot-channel --set <channel-mention|channel-id>`
* `?bot-channel --clear`

**選項**
* `-i, --info   `顯示機器人指令頻道(預設)
* `-s, --set    `設置機器人指令頻道
* `-c, --clear  `清除（重置）機器人指令頻道的設定

**範例**
* `?bot-channel -i`
* `?bot-channel --set #bot-commands`
* `?bot-channel -s #bot-commands`
* `?bot-channel --clear`
