module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_user_roles` ( `id` INT(10) NOT NULL AUTO_INCREMENT ,`userId` INT(10) NOT NULL,`roleId` INT(10) NOT NULL, `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("ALTER TABLE `l_user_roles` ADD INDEX `userId` (`userId`)", function (err, res) {
                conn.query ("ALTER TABLE `l_user_roles` ADD FOREIGN KEY (`userId`) REFERENCES `l_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                    conn.query ("ALTER TABLE `l_user_roles` ADD INDEX `roleId` (`roleId`)", function (err, res) {
                        conn.query ("ALTER TABLE `l_user_roles` ADD FOREIGN KEY (`roleId`) REFERENCES `l_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                            conn.query ("INSERT INTO `l_user_roles` ( `userId`, `roleId`) VALUES ('1', '1')", function (err, res) {
                                cb();
                            });
                        });
                    });
                });
            });
        });
    },
    "down": "drop table l_user_roles;"
}