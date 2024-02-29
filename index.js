const fs = require("fs");
const gd = require("gj-boomlings-api");
const colors = require("colors");
const prompts = require("prompts");
const yaml = require("js-yaml");
const Chance = require("chance");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let chance = new Chance();
console.log(
    "Warning: If you abuse this tool, GD Mods ".red +
        "WILL".white.bgRed +
        " ban your account, you ".red +
        "NEED".white.bgRed.bold +
        " to use a VPN and alt account".red
);
let config;
let username;
let password;
try {
    config = yaml.load(fs.readFileSync("./config.txt.yml", "utf8"));
} catch (error) {
    throw new Error(
        `Could load config, make sure it's formatted correctly:\n${error}`
    );
}
console.log(
    "Make sure to edit the ".green + "config".green.bold + " file!\n".green
);
(async () => {
    const response = await prompts([
        {
            type: "text",
            name: "username",
            message: "GD Username:",
        },
        {
            type: "text",
            name: "password",
            message: "GD Password:",
            style: "password",
        },
    ]);
    username = response.username;
    password = response.password;
    let data = await gd.getProfile(username).catch((error) => {
        throw new Error(`Could not fetch profile:\n${error}`);
    });
    if (data && data.accountID) {
        accountId = data.accountID;
    } else {
        throw new Error(
            `Could not fetch accountId (missing?):\n\n${JSON.stringify(
                data,
                null,
                2
            )}`
        );
    }
    while (true) {
        let levelId;

        try {
            const response = await fetch(
                "https://gdbrowser.com/api/search/*?type=recent"
            );
            const data = await response.json();

            if (data && data.length > 0) {
                levelId = data[0].id;
            }
        } catch (error) {
            throw new Error(`Could not fetch recent tab (is gdbrowser down?)`);
        }
        console.log(`Fetched levelId with success: ${levelId}`.green);
        console.log(
            `${username} will comment on level ${levelId} in ${config.comment_upload_delay} seconds`
        );
        await delay(1000 * config.comment_upload_delay);
        let message =
            config.messages[Math.floor(Math.random() * config.messages.length)];
        message = message.replace(
            "{random}",
            chance.string({
                length: config.random_length,
                alpha: true,
                numeric: false,
            })
        );
        console.log(`Commenting with message: ${message}`);
        try {
            const response = await gd.uploadComment(
                message,
                levelId,
                username,
                password
            );
            const data = response.data;

            if (data) {
                if (data == -1) {
                    console.log(
                        `Could not comment on level ${levelId} (got -1)`.red
                    );
                } else if (
                    typeof data === "string" &&
                    data.startsWith("temp")
                ) {
                    console.log(
                        `${username} is banned from uploading comments: ${data}`
                            .red
                    );
                } else {
                    console.log(
                        `${username} successfully commented on level ${levelId}`
                            .green
                    );
                }
            }
        } catch (error) {
            console.log(`Could not comment on level ${levelId}`.red);
            console.log(error);
        }
    }
})();
