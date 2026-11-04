
const FOODS=[
{id:1,n:'Paneer Tikka',d:'Charred cottage cheese, mint chutney, smoky spices.',p:9.5,c:'Starters',e:'🍢',g:['#f6d365','#fda085']},
{id:2,n:'Crispy Spring Rolls',d:'Golden rolls stuffed with garden vegetables.',p:7,c:'Starters',e:'🥟',g:['#fbc2eb','#a6c1ee']},
{id:3,n:'Truffle Fries',d:'Hand-cut fries, parmesan and white truffle oil.',p:8,c:'Starters',e:'🍟',g:['#ffecd2','#fcb69f']},
{id:4,n:'Butter Chicken',d:'Tandoori chicken in a velvety tomato-butter gravy.',p:15.5,c:'Mains',e:'🍛',g:['#f093fb','#f5576c']},
{id:5,n:'Margherita Pizza',d:'Wood-fired crust, San Marzano tomato, buffalo mozzarella.',p:13,c:'Mains',e:'🍕',g:['#ff9a9e','#fecfef']},
{id:6,n:'Wagyu Burger',d:'Wagyu patty, aged cheddar, brioche bun, house sauce.',p:17,c:'Mains',e:'🍔',g:['#84fab0','#8fd3f4']},
{id:7,n:'Chocolate Lava Cake',d:'Molten dark chocolate centre with vanilla cream.',p:8.5,c:'Desserts',e:'🍫',g:['#5f2c82','#49a09d']},
{id:8,n:'Mango Cheesecake',d:'Silky baked cheesecake with Alphonso mango glaze.',p:8,c:'Desserts',e:'🍰',g:['#fddb92','#d1fdff']},
{id:9,n:'Gulab Jamun',d:'Warm milk dumplings soaked in rose-cardamom syrup.',p:6,c:'Desserts',e:'🍮',g:['#ee9ca7','#ffdde1']},
{id:10,n:'Mango Lassi',d:'Chilled yoghurt drink blended with ripe mango.',p:5,c:'Drinks',e:'🥭',g:['#f9d423','#ff4e50']},
{id:11,n:'Iced Matcha',d:'Ceremonial matcha over ice with oat milk.',p:6,c:'Drinks',e:'🍵',g:['#a8e063','#56ab2f']},
{id:12,n:'Fresh Lime Soda',d:'Sparkling lime, mint and a touch of black salt.',p:4,c:'Drinks',e:'🍋',g:['#f7f8a1','#7ee8fa']}];
const FOOD_IMAGES={
1:'images/paneer-tikka.jpg',
2:'images/spring-rolls.jpg',
3:'images/fries.jpg',
4:'images/butter-chicken.jpg',
5:'images/pizza.jpg',
6:'images/burger.jpg',
7:'images/lava-cake.jpg',
8:'images/cheesecake.jpg',
9:'images/gulab-jamun.jpg',
10:'images/mango-lassi.jpg',
11:'images/matcha.jpg',
12:'images/lime-soda.jpg'
};
const CATS=['All','Starters','Mains','Desserts','Drinks'];
const $=s=>document.querySelector(s),money=n=>'$'+n.toFixed(2);
let cart={},cat='All',q='';
function renderCats(){$('#cats').innerHTML=CATS.map(c=>`<button class="chip ${c==cat?'on':''}" data-c="${c}">${c}</button>`).join('')}
function renderGrid(){const l=FOODS.filter(f=>(cat=='All'||f.c==cat)&&(f.n+f.d).toLowerCase().includes(q));
$('#grid').innerHTML=l.length?l.map((f,i)=>`<article class="card" style="animation-delay:${i*60}ms"><div class="img"><img src="${FOOD_IMAGES[f.id]}" alt="${f.n}" loading="lazy" onerror="this.style.display='none'"></div><div class="info"><h3>${f.n}</h3><p>${f.d}</p><div class="row"><b class="price">${money(f.p)}</b><button class="add" data-add="${f.id}">+ Add</button></div></div></article>`).join(''):'<p class="empty">No dishes found.</p>'}
function renderCart(){const ids=Object.keys(cart);let t=0,n=0;
$('#items').innerHTML=ids.length?ids.map(id=>{const f=FOODS.find(x=>x.id==id),k=cart[id];t+=f.p*k;n+=k;return `<div class="line"><img class="le" src="${FOOD_IMAGES[f.id]}" alt="${f.n}" loading="lazy"><div><b>${f.n}</b><small>${money(f.p)}</small></div><div class="qty"><button data-dec="${id}">−</button><i>${k}</i><button data-inc="${id}">+</button></div><button class="rm" data-rm="${id}">✕</button></div>`}).join(''):'<p class="empty">Your cart is empty.</p>';
$('#total').textContent=money(t);document.querySelectorAll('.count').forEach(e=>{e.textContent=n;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')})}
document.addEventListener('click',e=>{const d=e.target.closest('button,[data-open]');if(!d)return;const D=d.dataset;
if(D.c){cat=D.c;renderCats();renderGrid()}
if(D.add||D.inc){const i=D.add||D.inc;cart[i]=(cart[i]||0)+1;renderCart();if(D.add){d.textContent='✓ Added';setTimeout(()=>d.textContent='+ Add',700)}}
if(D.dec){const i=D.dec;if(--cart[i]<1)delete cart[i];renderCart()}
if(D.rm){delete cart[D.rm];renderCart()}
if(D.open!==undefined)$('#drawer').classList.add('open'),$('#veil').classList.add('on');
if(D.close!==undefined||d.id=='veil'){$('#drawer').classList.remove('open');$('#veil').classList.remove('on')}
if(D.done!==undefined)$('#ok').classList.remove('on')});
$('#veil').onclick=()=>{$('#drawer').classList.remove('open');$('#veil').classList.remove('on')};
$('#q').oninput=e=>{q=e.target.value.toLowerCase();renderGrid()};
$('#order').onsubmit=e=>{e.preventDefault();if(!Object.keys(cart).length){alert('Please add items first.');return}
const o={name:$('#nm').value,phone:$('#ph').value,table:$('#tb').value,items:cart,total:$('#total').textContent};
try{localStorage.setItem('pf_last_order',JSON.stringify(o))}catch(x){}
cart={};renderCart();e.target.reset();$('#drawer').classList.remove('open');$('#veil').classList.remove('on');$('#ok').classList.add('on')};
renderCats();renderGrid();renderCart();
