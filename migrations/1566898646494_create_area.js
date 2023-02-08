module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_area` ( `id` INT(10) NOT NULL AUTO_INCREMENT , `name` VARCHAR(255) NOT NULL , `long` VARCHAR(255) NULL , `lat` VARCHAR(255) NULL,`pincode` INT(32) NOT NULL,`cityId` INT(10) NOT NULL, `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("ALTER TABLE `l_area` ADD UNIQUE( `pincode`);", function (err, res) {
                conn.query ("ALTER TABLE `l_area` ADD INDEX `cityId` (`cityId`)", function (err, res) {
                    conn.query ("ALTER TABLE `l_area` ADD FOREIGN KEY (`cityId`) REFERENCES `l_city`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;", function (err, res) {
                        cb();
                    });
                });
            });
        });


    },
    "down": "drop table l_area;"
}