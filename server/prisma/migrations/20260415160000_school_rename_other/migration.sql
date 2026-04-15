-- 选项「其他」更名为「其他高校」：回填旧数据并更新列默认值
UPDATE "ActivityQr" SET "school" = '其他高校' WHERE "school" = '其他';
ALTER TABLE "ActivityQr" ALTER COLUMN "school" SET DEFAULT '其他高校';
