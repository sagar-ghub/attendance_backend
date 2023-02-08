module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_user` ( `id` INT(32) NOT NULL AUTO_INCREMENT , `firstName` VARCHAR(255) NOT NULL , `lastName` VARCHAR(255) NOT NULL , `password` VARCHAR(255) NOT NULL , `dateOfBirth` DATE NULL , `createdBy` INT(32) UNSIGNED NOT NULL , `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, primary key (id))", function (err, res) {
            conn.query ("ALTER TABLE `l_user` ADD `status` ENUM('active','inactive','pending','') NOT NULL DEFAULT 'active' AFTER `dateOfBirth`;", function (err, res) {
                conn.query ("ALTER TABLE `l_user` ADD `email` VARCHAR(180) NOT NULL AFTER `id`, ADD UNIQUE `email` (`email`);", function (err, res) {
                    conn.query ("INSERT INTO `l_user` (`id`, `email`, `firstName`, `lastName`, `password`, `dateOfBirth`, `status`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`) VALUES (NULL, 'admin@admin.com', 'admin', 'admin', MD5('admin'), NULL, 'active', '1', CURRENT_TIMESTAMP, NULL, NULL);", function (err, res) {
                        cb();
                    });
                });
            });
        });
    },
    "down": "drop table l_user;"
}