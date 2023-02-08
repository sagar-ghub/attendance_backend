module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_user_city` ( `id` INT(10) NOT NULL AUTO_INCREMENT ,`userId` INT(10) NOT NULL,`cityId` INT(10) NOT NULL, `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("ALTER TABLE `l_user_city` ADD INDEX `userId` (`userId`)", function (err, res) {
                conn.query ("ALTER TABLE `l_user_city` ADD FOREIGN KEY (`userId`) REFERENCES `l_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                    conn.query ("ALTER TABLE `l_user_city` ADD INDEX `cityId` (`cityId`)", function (err, res) {
                        conn.query ("ALTER TABLE `l_user_city` ADD FOREIGN KEY (`cityId`) REFERENCES `l_city`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                            cb();
                        });
                    });
                });
            });
        });
    },
    "down": "drop table l_user_city;"
}