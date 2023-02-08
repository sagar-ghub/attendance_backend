drop procedure if exists UpdateData;
DELIMITER //
create procedure UpdateData(in p_table_json json)
    begin
        declare v_table_name varchar(255) CHARSET utf8 default null;
        declare v_data_keys json default null;
        declare v_data_key varchar(255) CHARSET utf8 default null;
        declare v_conditions json default null;
        declare v_condition json default null;
        declare v_update_query longtext CHARSET utf8 default null;
        declare v_condition_query longtext CHARSET utf8 default null;
        declare i int default 0;

        if JSON_VALID(p_table_json) then
            #check if table_name exists
            set v_table_name = JSON_EXTRACT(p_table_json, '$.table_name');

            if (v_table_name is not null) then
                #check if data exists and type is object

                if (JSON_CONTAINS_PATH(p_table_json, 'one', '$.data') = 1)
                && (JSON_LENGTH(p_table_json, '$.data') > 0)
                && (JSON_CONTAINS_PATH(p_table_json, 'one', '$.cond') = 1)
                && (JSON_LENGTH(p_table_json, '$.cond') > 0) then

                    set v_data_keys = JSON_KEYS(p_table_json, '$.data');

                    while i < JSON_LENGTH(v_data_keys) do
                        select JSON_EXTRACT(v_data_keys,CONCAT('$[',i,']')) into v_data_key;

                        if (i = 0) then
                            set v_update_query = '';
                        end if;

                        set v_update_query = CONCAT(v_update_query, JSON_UNQUOTE(v_data_key),' = ', JSON_EXTRACT(p_table_json, CONCAT('$.data.',v_data_key)),', ');

                        if (i = (JSON_LENGTH(v_data_keys)-1)) then
                            set v_update_query = CONCAT(left(v_update_query,length(v_update_query) -2));
                        end if;

                        select i + 1 into i;
                    end while;

                    set v_conditions = JSON_EXTRACT(p_table_json, '$.cond');

                    set i = 0;
                    while i < JSON_LENGTH(v_conditions) do
                        select JSON_EXTRACT(v_conditions,CONCAT('$[',i,']')) into v_condition;

                        set @condition_type = JSON_EXTRACT(v_condition,'$.type');

                        if (i = 0) then
                            set v_condition_query = '';
                            set @condition_type = '';

--                            if(@condition_type is null) then
--                                set @condition_type = '';
--                            end if;
                        end if;

                        set v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', JSON_EXTRACT(v_condition,'$.value'));

                        if (i = (JSON_LENGTH(v_conditions)-1)) then
                            set v_condition_query = CONCAT(left(v_condition_query,length(v_condition_query)));
                        end if;

                        select i + 1 into i;
                    end while;

                #making final SQL
                set @v_final_query = CONCAT('UPDATE ', JSON_UNQUOTE(v_table_name), ' SET ', v_update_query, ' WHERE ', v_condition_query,';');

                prepare stmt from @v_final_query;
                execute stmt;

                select ROW_COUNT() into @row_status;

                if @row_status > 0 then
                    select JSON_OBJECT('message',CONCAT('Updated ',@row_status,' row(s)'), 'status', 'success') as response;
                else
                    select JSON_OBJECT('message',CONCAT('Updated ',@row_status,' row'), 'status', 'success') as response;
                end if;
                deallocate prepare stmt;
            else
                select JSON_OBJECT('message','data key missing/wrong structure', 'status', 'error') as response;
            end if;
        else
            select JSON_OBJECT('message','table_name key missing', 'status', 'error') as response;
        end if;

   else
        select JSON_OBJECT('message','Wrong JSON Format', 'status', 'error') as response;
   end if;
   end //
 DELIMITER ;