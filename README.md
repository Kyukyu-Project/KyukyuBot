
# Kyukyu

Kyukyu is an open-source Discord bot for information related to
Art of War:Legions.

The name is derived from Kyuubi, which means "Nine-Tailed" in Japanese.

## Commands

- [general commands](help/en/general.md)
- [administrator commands](help/en/admin.md)

----

## Inviting the bot to your server

- Go to #bot-commands channel on [Art of War: Legions server](https://discord.gg/6dVCDxmX7m)
- Run the `/invite` command and select the invite link.
- Select the server where you want to use the bot and select “Continue”.
- Review the bot permissions and select “Authorize”.

<!--
The bot requires the following permissions:

- MANAGE_ROLES
- SEND_MESSAGES
- SEND_MESSAGES_IN_THREADS
- ATTACH_FILES
- EMBED_LINKS
- READ_MESSAGE_HISTORY
- USE_EXTERNAL_EMOJIS
- ADD_REACTIONS
- USE_APPLICATION_COMMANDS
-->

----

## Managing the bot

- Run `/prefix set` command to set the command prefix (default is '?')
- Run `/admin-roles add` command to set admin roles
- Run `/mod-roles add` command to set moderator roles
- Run `/helper-roles add` command to set helper roles
- Run `/bot-channel set` command to set bot-command channel
- Run `/lang set` command to set language

After you make changes, the bot wait for 3 minutes and then update all
its commands.

- Run `/slash-deploy` command to immediately update all commands

----

## Roles and Privileges

Users with an **admin** role
- can use all [administrator commands](help/en/admin.md)
- can use all [general commands](help/en/general.md)
- can use `/say` and `/reply` commands
- can delete bot messages
- have no cool-down for using bot commands

Users with a **moderator** role
- can use all [general commands](help/en/general.md)
- can use `/say` and `/reply` commands
- can delete bot messages
- have no cool-down for using bot commands

Users with a **helper** role
- can delete bot messages
- have no cool-down for using bot commands

----

## Contribution

Almost all information are stored in `.json` files.
The easiest way to contribute is to create your own
content using a embed visualizer such as
[this](https://leovoel.github.io/embed-visualizer/)
and send it to the developer.
