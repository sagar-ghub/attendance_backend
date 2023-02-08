module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `l_role` ( `id` INT(10) NOT NULL AUTO_INCREMENT , `name` VARCHAR(255) NOT NULL , `machineName` VARCHAR(255) NOT NULL , `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP , `updatedBy` INT(32) UNSIGNED NULL , `updatedAt` DATETIME NULL, PRIMARY KEY (`id`))", function (err, res) {
            conn.query ("INSERT INTO `l_role` ( `name`, `machineName`) VALUES ('admin', 'admin')", function (err, res) {
                conn.query ("INSERT INTO `l_role` ( `name`, `machineName`) VALUES ( 'customer', 'customer')", function (err, res) {
                    conn.query ("INSERT INTO `l_role` ( `name`, `machineName`) VALUES ( 'cityAdmin', 'cityAdmin')", function (err, res) {
                        conn.query ("INSERT INTO `l_role` ( `name`, `machineName`) VALUES ( 'areaAdmin', 'areaAdmin')", function (err, res) {
                            conn.query ("INSERT INTO `l_role` ( `name`, `machineName`) VALUES ( 'deliveryAgent', 'deliveryAgent')", function (err, res) {
                                conn.query ("ALTER TABLE `l_role` ADD UNIQUE( `machineName`);", function (err, res) {
                                    cb();
                                });
                            });
                        });
                    });
                });
            });
        });


    },
    "down": "drop table l_role;"
}