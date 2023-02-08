module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_city` ( `id` INT(10) NOT NULL AUTO_INCREMENT , `name` VARCHAR(255) NOT NULL , `long` VARCHAR(255) NULL , `lat` VARCHAR(255) NULL, `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("INSERT INTO `l_city` ( `name`, `long`,`lat`) VALUES ('kolkata', '22.5726° N', '88.3639° E')", function (err, res) {
                    cb();
            });
        });


    },
    "down": "drop table l_city;"
}