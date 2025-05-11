document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            // 发送登录请求
            fetch('http://localhost:3000/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
           .then(res => res.json())
           .then(data => {
                if (data.success) {
                    // 登录成功，显示管理面板
                    document.getElementById('admin-panel').style.display = 'block';
                    document.querySelector('.Blogin-modal').style.display = 'none';
                } else {
                    alert(data.message || '登录失败');
                }
            })
           .catch(err => {
                alert('登录请求失败');
                console.error(err);
            });
        });
    }

    // 为商品项添加编辑和删除按钮的事件监听
    function addProductItemEventListeners() {
        // 编辑按钮事件
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 获取当前被点击的按钮上的 data-id 属性（就是商品的 ID）
                const productId = e.target.getAttribute('data-id');
                // 把这个商品的 ID 传进去
                editProduct(productId);
            });
        });

        // 删除按钮事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                deleteProduct(productId);
            });
        });
    }

    // 更新商品
    function editProduct(productId) {
        // 获取商品信息（get）
        fetch(`http://localhost:3000/admin/products/${productId}`)
       .then(res => res.json())
       .then(data => {
            if(data.success) {
                const product = data.product;

                // 填充表单
                document.querySelector('#update-name').value = product.name;
                document.querySelector('#update-image').value = product.image;
                document.querySelector('#update-price').value = product.price;
                document.querySelector('#update-stock').value = product.stock;
                document.querySelector('#update-sales').value = product.sales || 0;

                // 显示商品图片
                const updatePreviewContainer = document.querySelector('.update-preview-container');
                updatePreviewContainer.innerHTML = `<img src="${product.image}" alt="商品图片">`;

                // 设置商品ID
                document.querySelector('.update-form').setAttribute('data-product-id', productId);

                // 显示遮罩和表单
                document.querySelector('.overlay').style.display = 'block';
                document.querySelector('.update-form').style.display = 'block';
            } else {
                alert(data.message || '获取商品信息失败');
            }
        })
       .catch(err => {
            alert('获取商品信息失败');
            console.error(err);
        });
    }
});