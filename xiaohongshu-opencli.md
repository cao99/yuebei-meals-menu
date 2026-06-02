# 使用小红书 OpenCLI 完成任务的过程

## 任务目标
参照提供的小红书链接，在"做法.md"文件中补充周日的午餐内容，格式完全参照周一。

## 完成步骤

### 1. 读取现有内容
首先读取"食谱.md"文件，了解周一午餐的格式结构：
```markdown
## 周一
1. 做法描述：
   - 菜品：...
   - 准备食材：...
   - 具体步骤：...
2. 参考链接：...
3. 参考图片：...
```

### 2. 获取小红书笔记内容

#### 2.1 查看命令帮助
```bash
opencli xiaohongshu --help
```

可用的主要命令：
- `note <note-id>` - 获取小红书笔记正文和互动数据
- `download <note-id>` - 下载小红书笔记中的图片和视频

#### 2.2 获取笔记详情
笔记ID：`69f8554a000000003601c688`

命令：
```bash
opencli xiaohongshu note "https://www.xiaohongshu.com/explore/69f8554a000000003601c688?xsec_token=CB4rXv7oU6LVRLfI5Dg2rKRK4YH_Mbex8qXnx8KY83xBU=" -f json
```

获取到的关键信息：
- 标题：小孩超爱吃的豆角炒肉末拌米饭绝了
- 菜品：豆角炒肉末盖饭
- 内容：长豆角切碎，搭配鲜香肉末，不塞牙、好咀嚼

### 3. 补充周日午餐文字内容

参照周一的格式，编写周日午餐的详细做法描述：

```markdown
## 周日
1. 做法描述：
   - 菜品：豆角炒肉末盖饭。
   - 准备食材：米饭、长豆角、肉末、蒜末、宝宝辅食油。长豆角洗净切小碎丁，肉末备用。
   - 炒肉末：锅中放少量油，倒入肉末炒到完全变色后盛出。
   - 炒豆角：锅中留底油，放入蒜末爆香，加入豆角碎翻炒到变软。
   - 焖煮：放回肉末，加少量清水，一起翻炒并焖煮到豆角软烂、咸香入味。
   - 出餐：浇在米饭上，拌匀后放温给宝宝吃；如果豆角块偏大，可以再剪碎或压小。
2. 参考链接：https://www.xiaohongshu.com/explore/69f8554a000000003601c688?...
3. 参考图片：周日午餐.jpg
```

### 4. 下载并生成图片

#### 4.1 下载笔记资源
命令：
```bash
opencli xiaohongshu download "https://www.xiaohongshu.com/explore/69f8554a000000003601c688?xsec_token=CB4rXv7oU6LVRLfI5Dg2rKRK4YH_Mbex8qXnx8KY83xBU=" -f json
```

下载结果：
- 视频：69f8554a000000003601c688_1.mp4 (6.5 MB)
- 图片：69f8554a000000003601c688_2.jpg (149.5 KB)

#### 4.2 查找下载文件位置
```bash
find . -name "*69f8554a*" -type f
```

文件位置：
```
./xiaohongshu-downloads/69f8554a000000003601c688/69f8554a000000003601c688_2.jpg
```

#### 4.3 复制并重命名图片
```bash
cp ./xiaohongshu-downloads/69f8554a000000003601c688/69f8554a000000003601c688_2.jpg ./周日午餐.jpg
```

验证结果：
```bash
ls -lh 周日午餐.jpg
# -rw-r--r--@ 1 caoyongyong.1  staff   149K Jun  2 16:00 周日午餐.jpg
```

## 最终成果

1. **做法.md 文件**：周日午餐内容已完整补充，格式与周一一致
2. **周日午餐.jpg 图片**：已生成到项目根目录（149KB）

## 关键命令总结

| 操作 | 命令 |
|------|------|
| 获取笔记内容 | `opencli xiaohongshu note "<url-with-token>" -f json` |
| 下载笔记资源 | `opencli xiaohongshu download "<url-with-token>" -f json` |
| 查找文件 | `find . -name "*<note-id>*" -type f` |
| 复制文件 | `cp <source> <destination>` |

## 注意事项

1. 小红书命令需要完整的带 `xsec_token` 的 URL
2. 下载的文件默认保存在 `xiaohongshu-downloads/<note-id>/` 目录
3. 可以使用 `-f json` 参数获取结构化输出，方便解析