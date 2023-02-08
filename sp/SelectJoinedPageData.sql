drop procedure if exists SelectJoinedPageData;
DELIMITER $$
/*
 CALL SelectJoinedPageData('{
					"table_name" : "rp_user",
					"data" : ["SQL_CALC_FOUND_ROWS rp_user.user_id as userId", "rp_file.file_path as filePath"] ,
                    "joinString": "left join rp_file on rp_user.user_img = rp_file.file_id",
                    "cond" : [{"field" : "user_status", "opt" : "=", "value" : "inactive","type":"AND"}],
          "pagination": {
                          "status": false,
                          "limit": 2,
                          "offset": 0
                        },
          "order_by":{
                      "status":true,
                      "attr":"rp_user.user_id",
                      "order": "desc"
                    }

                    }');

*/
create procedure SelectJoinedPageData(in p_table_json json)
begin
  declare v_table_name LONGTEXT CHARSET utf8 default null;
  declare v_join_string LONGTEXT CHARSET utf8 default null;
  declare v_pagination LONGTEXT CHARSET utf8 default null;
  declare v_order_by LONGTEXT CHARSET utf8 default null;
  declare v_datas json default null;
  declare v_data LONGTEXT CHARSET utf8 default null;
  declare v_conditions json default null;
  declare v_condition json default null;
  declare v_select_query longtext CHARSET utf8 default "";
  declare v_condition_query longtext CHARSET utf8 default "";

  DECLARE v_offset INT(10) DEFAULT 0;
  DECLARE v_limit INT(10) DEFAULT 0;

  declare i int default 0;

  if JSON_VALID(p_table_json) then
    #check if table_name exists
    set v_table_name = JSON_EXTRACT(p_table_json, '$.table_name');
    set v_join_string = JSON_EXTRACT(p_table_json, '$.joinString');
    if (v_table_name is not null) then
      #check if data exists and type is object
      if (JSON_CONTAINS_PATH(p_table_json, 'one', '$.data') = 1)
        && (JSON_LENGTH(p_table_json, '$.data') > 0)
        && (JSON_CONTAINS_PATH(p_table_json, 'one', '$.cond') = 1)
      then
        set v_datas = JSON_EXTRACT(p_table_json, '$.data');
        while i < JSON_LENGTH(v_datas) do
        select JSON_EXTRACT(v_datas,CONCAT('$[',i,']')) into v_data;
        if (i = 0) then
          set v_select_query = '';
        end if;
        set v_select_query = CONCAT(v_select_query, JSON_UNQUOTE(v_data),', ');
        if (i = (JSON_LENGTH(v_datas)-1)) then
          set v_select_query = CONCAT(left(v_select_query,length(v_select_query) -2));
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
        end if;
        if (LCASE(JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.opt'))) = "like") then
          set v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', '\"%', JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.value')), '%\"');
        elseif (LCASE(JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.opt'))) = "in") then
          set v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', REPLACE(REPLACE(JSON_EXTRACT(v_condition, '$.value'), '[', '('), ']', ')'));
        else
          set v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', JSON_EXTRACT(v_condition,'$.value'));
        end if;
        if (i = (JSON_LENGTH(v_conditions)-1)) then
          set v_condition_query = CONCAT(left(v_condition_query,length(v_condition_query)));
        end if;
        select i + 1 into i;
        end while;
        #making final SQL
        set @v_final_query = CONCAT('SELECT SQL_CALC_FOUND_ROWS ', v_select_query, ' FROM ', JSON_UNQUOTE(v_table_name),' ', JSON_UNQUOTE(v_join_string) ,'',' WHERE 1', v_condition_query);

        -- Order By
        SET v_order_by = JSON_EXTRACT(p_table_json, '$.order_by');
        IF(JSON_EXTRACT(v_order_by,'$.status') = true) THEN

          SET @v_final_query = CONCAT(@v_final_query, " order by ",JSON_UNQUOTE(JSON_EXTRACT(v_order_by,'$.attr'))," ",JSON_UNQUOTE(JSON_EXTRACT(v_order_by,'$.order'))," ");

        END IF;

        -- pagination
        SET v_pagination = JSON_EXTRACT(p_table_json, '$.pagination');
        IF(JSON_EXTRACT(v_pagination,'$.status') = true) THEN
          SET v_offset = JSON_EXTRACT(v_pagination,'$.offset');
          SET v_limit = JSON_EXTRACT(v_pagination,'$.limit');
          SET @v_final_query = CONCAT(@v_final_query, " LIMIT ",v_limit," OFFSET ",v_offset," ");
        END IF;

        -- select @v_final_query;

        prepare stmt from @v_final_query;
        execute stmt;
        select FOUND_ROWS() into @row_status;
        select JSON_OBJECT('totalCount',@row_status, 'status', 'success') as response;
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
end $$
DELIMITER ;