// express框架 快速构建web服务器
const express = require('express');
// 连接mysql
const mysql = require('mysql2');
// 允许前端跨域访问后端接口
const cors = require('cors');
// 用户处理图片上传
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 图片上传配置，临时存放在uploads文件夹
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ dest: 'uploads/' });

// express实例
const app = express();
app.use(cors());
// 让服务器支持解析JSON格式的请求
app.use(express.json());
// 提供静态文件访问
app.use('/uploads', express.static('uploads'));

// 建立一个数据库连接池，mysql.createPool 会自动管理多个连接
const db = mysql.createPool({
    host:'localhost',
    user:'lml',
    password:'123.',
    database:'retail_system'
});

// 管理员登录
app.post('/admin/login',(req,res) => {
    // 从前端请求中解析出用户名和密码
    const {username,password} = req.body

    const query = 'select * from admins where username = ? and password = ?';
    db.query(query, [username,password],(err,results) =>{
        if(err) return res.status(500).json({success:false,message:'数据库错误'});

        if(results.length > 0){
            res.json({success:true,username});
        }else{
            res.json({success:false,message:'用户名或者密码错误'});
        }
    });
});

// 添加商品
app.post('/admin/products', (req,res) =>{
    const { name, image, price, stock} = req.body;
    const query = 'insert into products (name,image,price,stock,sales) values (?,?,?,?,0)';
    db.query(query,[name,image,price,stock],(err, result) => {
        if(err) return res.status(500).json({success:false,message:'添加商品失败'});
        res.json({success:true,message:'商品添加成功', id: result.insertId});
    });  
});

// 删除商品
app.delete('/admin/products/:id',(req,res) => {
    const{id} = req.params;
    const query = 'delete from products where id=?';

    db.query(query,[id],(err) => {
        if(err) return res.status(500).json({success:false,message:'删除商品失败'});
        res.json({success:true,message:'商品删除成功'});
    });
});

// 更新商品信息
app.put('/admin/products/:id', (req,res) => {
    const {id} = req.params;
    const { name, image, price, stock} = req.body;
    const query = 'update products set name = ?, image = ?, price = ?, stock = ? where id = ?';
    db.query(query,[name, image, price, stock, id], (err) => {
        if(err) return res.status(500).json({success: false, message:'更新商品失败'});
        res.json({success: true, message:'更新商品成功'});
    });
});

// 获取所有商品
app.get('/admin/products',(req,res) => {
    const query = 'select * from products';
    db.query(query,(err,results) => {
        if(err) return res.status(500).json({success: false, message: '数据库错误'});
        res.json({success: true, products: results});
    });
});

// 获得具体单个商品详情
app.get('/admin/products/:id',(req,res) => {
    const {id} = req.params;
    const query = 'select * from products where id = ?';
    
    db.query(query, [id], (err, results) => {
        if(err) return res.status(500).json({success: false, message: '数据库错误'});
        
        if(results.length > 0) {
            res.json({success: true, product: results[0]});
        } else {
            res.json({success: false, message: '商品不存在'});
        }
    });
});


// 上传图片
app.post('/admin/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({success: false, message: '没有上传文件'});
    }
    
    // 返回文件路径
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({success: true, imageUrl: fileUrl});
});

// // YOLO识别商品
// app.post('/admin/yolo-recognize', async (req, res) => {
//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//         return res.status(400).json({
//             success: false,
//             message: '未提供图片URL'
//         });
//     }

//     try {
//         // 获取图片本地路径(从URL中提取)
//         const localPath = imageUrl.replace('http://localhost:3000/uploads/', '');
//         const fullPath = path.join(__dirname, 'uploads', localPath);

//         // 可以使用child_process来执行Python脚本
//         const spawn = require('child_process').spawn;

//         // 假设Python脚本位于 python/detect.py
//         const pythonProcess = spawn('python', [
//             'D:\\qq.download\\yolov8_use\\yolov8_use\\onnx.py',
//             '--image', fullPath,
//             '--modal', 'D:\\qq.download\\yolov8_use\\yolov8_use\\best.onnx'
//         ]);

//         let result = '';
//         let error = '';

//         pythonProcess.stdout.on('data', (data) => {
//             result += data.toString();
//         });

//         pythonProcess.stderr.on('data', (data) => {
//             error += data.toString();
//             console.error(`Python错误: ${data}`);
//         });

//         pythonProcess.on('close', (code) => {
//             if (code !== 0) {
//                 return res.status(500).json({
//                     success: false,
//                     message: 'YOLO识别失败',
//                     error: error
//                 });
//             }

//             try {
//                 // 解析python输出结果
//                 const detectionResults = parseYOLOOutput(result);
//                 const bestResult = detectionResults[0];

//                 if (bestResult) {
//                     res.json({
//                         success: true,
//                         productInfo: {
//                             name: bestResult.className,
//                             confidence: bestResult.confidence
//                         }
//                     });
//                 } else {
//                     res.json({
//                         success: false,
//                         message: '未检测到商品'
//                     });
//                 }
//             } catch (error) {
//                 res.status(500).json({
//                     success: false,
//                     message: '解析识别结果失败',
//                     error: error.message
//                 });
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: '识别过程出错',
//             error: error.message
//         });
//     }
// });

function parseYOLOOutput(output){
    const result = [];
    const lines = output.split('\n');

    let currentObject = null;
    for(const line of lines){
        if(line.includes('物体')){
            if(currentObject){
                results.push(currentObject);
            }
            currentObject = {};
        }else if(currentObject){
            if(line.includes('类别:')){
                const className = line.split(':')[1].trim().split(' ')[0];
                currentObject.className = className;
            }else if (line.includes('置信度:')){
                const confidence = parseFloat(line.split(':')[1].trim());
                currentObject.confidence = confidence;
            }
        }
    }
    if (currentObject) {
        results.push(currentObject);
    }

    // 按置信度排序
    return results.sort((a, b) => b.confidence - a.confidence);
}

app.listen(3000,() =>{
    console.log('后台管理系统服务器运行在 http://localhost:3000');
});


// 用户端获取商品列表的接口
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '无法获取商品列表'
            });
        }
        res.json({
            success: true,
            products: results
        });
    });
});

// 用户购买商品接口
app.post('/products/buy/:id', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    // 查询库存是否足够
    const checkStockQuery = 'SELECT stock FROM products WHERE id = ?';
    db.query(checkStockQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '数据库查询错误'
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        const stock = results[0].stock;
        if (stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '库存不足'
            });
        }

        // 扣减库存并增加销量
        const updateStockQuery = `
            UPDATE products
            SET stock = stock - ?, sales = sales + ?
            WHERE id = ?
        `;
        db.query(updateStockQuery, [quantity, quantity, id], (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '更新库存失败'
                });
            }
            res.json({
                success: true,
                message: '购买成功'
            });
        });
    });
});