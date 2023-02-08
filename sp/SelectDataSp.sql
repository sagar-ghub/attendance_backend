DELIMITER $$
USE `aimrecharge`$$
-- CALL SelectData('{"table_name" : "rp_user", "data" : ["*"] , "cond" : [{"field" : "user_status", "opt" : "=", "value" : "inactive","type":"AND"}] }');
DROP PROCEDURE IF EXISTS SelectDataSp$$
CREATE PROCEDURE SelectDataSp(IN p_table_json JSON)
    BEGIN
        DECLARE v_table_name VARCHAR(255) CHARSET utf8 DEFAULT NULL;
        DECLARE v_datas JSON DEFAULT NULL;
        DECLARE v_data TEXT CHARSET utf8 DEFAULT NULL;
        DECLARE v_conditions JSON DEFAULT NULL;
        DECLARE v_condition JSON DEFAULT NULL;
        DECLARE v_select_query LONGTEXT CHARSET utf8 DEFAULT "";
        DECLARE v_condition_query LONGTEXT CHARSET utf8 DEFAULT "";
    	DECLARE v_pagination_query TEXT CHARSET utf8 DEFAULT ' ';
        DECLARE v_pagination JSON DEFAULT NOT NULL;
	DECLARE i INT DEFAULT 0;
	DECLARE v_sort_query TEXT CHARSET utf8 DEFAULT '';
	DECLARE v_sort TEXT CHARSET utf8 DEFAULT '';

        IF JSON_VALID(p_table_json) THEN
            #check if table_name exists
            SET v_table_name = JSON_EXTRACT(p_table_json, '$.table_name');

            IF (v_table_name IS NOT NULL) THEN
                #check if data exists and type is object

                IF (JSON_CONTAINS_PATH(p_table_json, 'one', '$.data') = 1)&& (JSON_LENGTH(p_table_json, '$.data') > 0)&& (JSON_CONTAINS_PATH(p_table_json, 'one', '$.cond') = 1)
                 THEN -- && (JSON_LENGTH(p_table_json, '$.cond') > 0)

                    SET v_datas = JSON_EXTRACT(p_table_json, '$.data');
             
                    WHILE i < JSON_LENGTH(v_datas) DO
                        SELECT JSON_EXTRACT(v_datas,CONCAT('$[',i,']')) INTO v_data;

                        IF (i = 0) THEN
                            SET v_select_query = '';
                        END IF;

                        SET v_select_query = CONCAT(v_select_query, JSON_UNQUOTE(v_data),', ');

                        IF (i = (JSON_LENGTH(v_datas)-1)) THEN
                            SET v_select_query = CONCAT(LEFT(v_select_query,LENGTH(v_select_query) -2));
                        END IF;

                        SELECT i + 1 INTO i;
                    END WHILE;

                    SET v_conditions = JSON_EXTRACT(p_table_json, '$.cond');

                    SET i = 0;
                   -- if JSON_EXTRACT(`v_conditions`, '$[0]') !="{}" then


						WHILE i < JSON_LENGTH(v_conditions) DO
                        SELECT JSON_EXTRACT(v_conditions,CONCAT('$[',i,']')) INTO v_condition;

                        SET @condition_type = JSON_EXTRACT(v_condition,'$.type');

                        IF (i = 0) THEN
                            SET v_condition_query = '';
                        END IF;
                                    IF (LCASE(JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.opt'))) = "like") THEN
                                        SET v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', '\"%', JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.value')), '%\"');
                        			ELSEIF (LCASE(JSON_UNQUOTE(JSON_EXTRACT(v_condition, '$.opt'))) = "in") THEN
                        			    SET v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', REPLACE(REPLACE(JSON_EXTRACT(v_condition, '$.value'), '[', '('), ']', ')'));
                        			ELSE
                        				SET v_condition_query = CONCAT(v_condition_query, CONCAT(' ', JSON_UNQUOTE(@condition_type), ' '), JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.field')),' ', JSON_UNQUOTE(JSON_EXTRACT(v_condition,'$.opt')), ' ', JSON_EXTRACT(v_condition,'$.value'));
                        			END IF;

                        IF (i = (JSON_LENGTH(v_conditions)-1)) THEN
                            SET v_condition_query = CONCAT(LEFT(v_condition_query,LENGTH(v_condition_query)));
                        END IF;

                        SELECT i + 1 INTO i;
                    END WHILE;
                    	#Pagination
				SET v_pagination = JSON_EXTRACT(p_table_json, '$.pagination');
				#SELECT v_pagination;
				IF (JSON_EXTRACT(v_pagination, '$.status') = TRUE) THEN
					SET v_pagination_query = CONCAT(' LIMIT ', JSON_EXTRACT(v_pagination, '$.limit'), ' OFFSET ',JSON_EXTRACT(v_pagination, '$.offset'));
				END IF;
				SET v_sort = JSON_EXTRACT(p_table_json, '$.sortFilter');
							IF (JSON_EXTRACT(v_sort, '$.status') = TRUE) THEN
							SET v_sort_query = CONCAT(' ORDER BY ', JSON_UNQUOTE(JSON_EXTRACT(v_sort, '$.fieldName')), ' ',	JSON_UNQUOTE(JSON_EXTRACT(v_sort, '$.arrange')));
							END IF;

                #making final SQL
                SET @v_final_query = CONCAT('SELECT ', v_select_query, ' FROM ', JSON_UNQUOTE(v_table_name), ' WHERE 1', v_condition_query, v_sort_query, v_pagination_query ,';');

                -- else
                #making final SQL
              --  set @v_final_query = CONCAT('SELECT ', v_select_query, ' FROM ', JSON_UNQUOTE(v_table_name), ' WHERE ', 1,';');

                   -- end if;

              -- SELECT @v_final_query;
                PREPARE stmt FROM @v_final_query;
                EXECUTE stmt;
                SELECT FOUND_ROWS() INTO @row_status;
				SELECT JSON_OBJECT('totalCount',@row_status, 'status', 'success') AS response;
                DEALLOCATE PREPARE stmt;
            ELSE
                SELECT JSON_OBJECT('message','data key missing/wrong structure', 'status', 'error') AS response;
            END IF;
        ELSE
            SELECT JSON_OBJECT('message','table_name key missing', 'status', 'error') AS response;
        END IF;
         
   ELSE
        SELECT JSON_OBJECT('message','Wrong JSON Format', 'status', 'error') AS response;
   END IF;
   END $$
 DELIMITER$$