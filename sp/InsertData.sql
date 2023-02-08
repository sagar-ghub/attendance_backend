drop procedure if exists InsertData;
DELIMITER $$
CREATE PROCEDURE `InsertData`(in p_table_json json)
begin
        declare v_table_name varchar(255) CHARSET utf8 default null;
        declare v_p_key varchar(255) CHARSET utf8 default null;
        declare v_data_keys json default null;
        declare v_data_key varchar(255) CHARSET utf8 default null;
        declare v_field_query text CHARSET utf8 default null;
        declare v_data_query longtext CHARSET utf8 default null;
        declare i int default 0;

        if JSON_VALID(p_table_json) then
            #check if table_name exists
            set v_table_name = JSON_EXTRACT(p_table_json, '$.table_name');
            set v_p_key = JSON_EXTRACT(p_table_json, '$.p_key');

            if (v_table_name is not null && v_p_key is not null) then
                #check if data exists and type is object

                if (JSON_CONTAINS_PATH(p_table_json, 'one', '$.data') = 1) && (JSON_LENGTH(p_table_json, '$.data') > 0)then
                    set v_data_keys = JSON_KEYS(p_table_json, '$.data');

                    while i < JSON_LENGTH(v_data_keys) do
                        select JSON_EXTRACT(v_data_keys,CONCAT('$[',i,']')) into v_data_key;

                        if (i = 0) then
                            set v_field_query = '(';
                            set v_data_query = '(';
                        end if;

                        set v_field_query = CONCAT(v_field_query,JSON_UNQUOTE(v_data_key),', ');
                        set v_data_query = CONCAT(v_data_query, JSON_EXTRACT(p_table_json, CONCAT('$.data.',v_data_key)),', ');

                        if (i = (JSON_LENGTH(v_data_keys)-1)) then
                            set v_field_query = CONCAT(left(v_field_query,length(v_field_query) -2), ')');
                            set v_data_query = CONCAT(left(v_data_query,length(v_data_query) -2), ')');
                        end if;

                        select i + 1 into i;
                    end while;

                #making final SQL
                set @v_final_query = CONCAT('INSERT INTO ', JSON_UNQUOTE(v_table_name), v_field_query, ' VALUES ', v_data_query, ";");

                prepare stmt from @v_final_query;
                execute stmt;

                select ROW_COUNT() into @row_status;
                deallocate prepare stmt;
                if @row_status > 0 then
					select JSON_OBJECT('message',CONCAT('Inserted ',@row_status,' row'), 'status', 'success') as response;

                    set @v_select_query = CONCAT('SELECT * FROM ', JSON_UNQUOTE(v_table_name),' WHERE ',JSON_UNQUOTE(v_p_key),' =', LAST_INSERT_ID(), ";");

					prepare stmt from @v_select_query;
					execute stmt;

					deallocate prepare stmt;

                else
                    select JSON_OBJECT('message', 'something went wrong', 'status', 'error') as response;
                end if;

            else
                select JSON_OBJECT('message','data key missing/wrong structure', 'status', 'error') as response;
            end if;
        else
            select JSON_OBJECT('message','table_name key missing', 'status', 'error') as response;
        end if;

   else
        select JSON_OBJECT('message','Wrong JSON Format', 'status', 'error') as response;
   end if;
   end$$
   DELIMITER ;
