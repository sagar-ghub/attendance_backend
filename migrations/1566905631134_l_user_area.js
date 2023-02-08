module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_user_area` ( `id` INT(10) NOT NULL AUTO_INCREMENT ,`userId` INT(10) NOT NULL,`areaId` INT(10) NOT NULL, `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("ALTER TABLE `l_user_area` ADD INDEX `userId` (`userId`)", function (err, res) {
                conn.query ("ALTER TABLE `l_user_area` ADD FOREIGN KEY (`userId`) REFERENCES `l_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                    conn.query ("ALTER TABLE `l_user_area` ADD INDEX `areaId` (`areaId`)", function (err, res) {
                        conn.query ("ALTER TABLE `l_user_area` ADD FOREIGN KEY (`areaId`) REFERENCES `l_area`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                            cb();
                        });
                    });
                });
            });
        });
    },
    "down": "drop table l_user_area;"
}