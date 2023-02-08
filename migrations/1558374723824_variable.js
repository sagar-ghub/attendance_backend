module.exports = {
    "up": function (conn, cb) {
        conn.query ("CREATE TABLE `variable` ( `id` INT NOT NULL , `name` VARCHAR(255) NOT NULL , `value` VARCHAR(255) NOT NULL , PRIMARY KEY (`id`), UNIQUE (`name`))", function (err, res) {
            conn.query ("INSERT INTO `variable` (`id`, `name`, `value`) VALUES ('', 'deliveryFee', '10')", function (err, res) {
                cb();
            });
        });


    },
    "down": "drop table variable;"
}