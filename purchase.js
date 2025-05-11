// 加载商品列表
function loadProducts() {
    fetch('http://localhost:3000/products')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const productList = document.querySelector('#product-list');
                productList.innerHTML = ''; // 清空现有列表

                // 遍历商品数据并创建商品项
                data.products.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.className = 'product-item';
                    productItem.innerHTML = `
                        <img src="${product.image}" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p>价格: ¥${product.price}</p>
                        <p>库存: ${product.stock}</p>
                        <p>销量: ${product.sales || 0}</p>
                        <button class="buy-btn" data-id="${product.id}" data-stock="${product.stock}">购买</button>
                    `;
                    productList.appendChild(productItem);
                });

                // 添加购买按钮事件监听
                addBuyEventListeners();
            } else {
                alert(data.message || '加载商品列表失败');
            }
        })
        .catch(err => {
            alert('加载商品列表失败');
            console.error(err);
        });
}

// 添加购买按钮事件监听
function addBuyEventListeners() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            const stock = parseInt(e.target.getAttribute('data-stock'), 10);

            if (stock <= 0) {
                alert('库存不足，无法购买');
                return;
            }

            showBuyModal(productId);
        });
    });
}

// 显示购买弹窗
function showBuyModal(productId) {
    const overlay = document.querySelector('.overlay');
    const updateForm = document.querySelector('.update-form');

    overlay.style.display = 'block';
    updateForm.style.display = 'block';

    // 确认购买
    document.querySelector('.confirm-btn').onclick = () => {
        const quantity = parseInt(document.querySelector('#buy-quantity').value, 10);

        if (!quantity || quantity <= 0) {
            alert('请输入有效的购买数量');
            return;
        }

        purchaseProduct(productId, quantity);
    };

    // 取消购买
    document.querySelector('.cancel-btn').onclick = () => {
        overlay.style.display = 'none';
        updateForm.style.display = 'none';
    };
}

// 购买商品
function purchaseProduct(productId, quantity) {
    fetch(`http://localhost:3000/products/buy/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.update-form').style.display = 'none';
                loadProducts(); // 重新加载商品列表
            }
        })
        .catch(err => {
            alert('购买失败');
            console.error(err);
        });
}

// 页面加载时加载商品列表
document.addEventListener('DOMContentLoaded', loadProducts);