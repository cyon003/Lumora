import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../database/prisma.js";

const accounts = [
  { name: "Lumora Admin", email: "admin@gmail.com", password: "admin123", role: "ADMIN" },
  { name: "Lumora Manager", email: "manager@gmail.com", password: "manager123", role: "MANAGER" },
  { name: "Lumora Head Lady", email: "headlady@gmail.com", password: "headlady123", role: "HEAD_LADY" },
  { name: "Lumora Bar", email: "bar@gmail.com", password: "bar123", role: "BAR" },
  { name: "Lumora Kitchen", email: "kitchen@gmail.com", password: "kitchen123", role: "KITCHEN" },
  { name: "Lumora Waiter", email: "waiter@gmail.com", password: "waiter123", role: "WAITER" },
];

async function seed() {
  let branch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
  if (!branch) {
    const restaurant = await prisma.restaurant.create({
      data: { name: "Lumora Restaurant", branches: { create: { name: "Riverside Kitchen" } } },
      include: { branches: true },
    });
    branch = restaurant.branches[0];
  }

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, passwordHash, role: account.role, branchId: branch.id },
      create: { name: account.name, email: account.email, passwordHash, role: account.role, branchId: branch.id },
    });
  }

  await prisma.user.deleteMany({
    where: { email: { in: ["admin@lumora.local", "cashier@lumora.local", "kitchen@lumora.local", "waiter@lumora.local", "cashier@gmail.com"] } },
  });

  if (await prisma.room.count({ where: { branchId: branch.id } }) === 0) {
    await prisma.room.createMany({ data: [
      { name: "Room1", floorNumber: 1, capacity: 6, hourlyRate: 18, branchId: branch.id },
      { name: "Room2", floorNumber: 1, capacity: 8, hourlyRate: 24, branchId: branch.id },
      { name: "Room3", floorNumber: 2, capacity: 12, hourlyRate: 35, branchId: branch.id },
      { name: "Room4", floorNumber: 2, capacity: 16, hourlyRate: 48, branchId: branch.id },
    ] });
  }

  if (await prisma.employee.count({ where: { branchId: branch.id, role: "LADY" } }) === 0) {
    await prisma.employee.createMany({ data: [
      { name: "Nina Rose", role: "LADY", branchId: branch.id, hourlyRate: 15 },
      { name: "Sofia Tran", role: "LADY", branchId: branch.id, hourlyRate: 15 },
      { name: "Mia Chen", role: "LADY", branchId: branch.id, hourlyRate: 15 },
    ] });
  }

  const existingStaff = await prisma.employee.findMany({ where: { branchId: branch.id }, orderBy: { id: "asc" } });
  for (const [index, employee] of existingStaff.entries()) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        staffId: employee.staffId || `STF-${String(index + 1).padStart(3, "0")}`,
        role: employee.role === "SERVER" ? "WAITER" : employee.role === "CASHIER" ? "MANAGER" : employee.role,
      },
    });
  }

  const category = await prisma.menuCategory.upsert({
    where: { branchId_name: { branchId: branch.id, name: "Karaoke Favorites" } },
    update: {},
    create: { name: "Karaoke Favorites", branchId: branch.id },
  });
  const sampleMenu = [
    { name: "Tiger Beer Tower", price: 32, emoji: "🍺" },
    { name: "Karaoke Snack Platter", price: 24, emoji: "🍟" },
    { name: "Spicy Chicken Wings", price: 14, emoji: "🍗" },
    { name: "Fresh Fruit Platter", price: 12, emoji: "🍉" },
    { name: "Sparkling Water", price: 4, emoji: "💧" },
  ];
  const menuItems = {};
  for (const item of sampleMenu) {
    menuItems[item.name] = await prisma.menuItem.findFirst({ where: { branchId: branch.id, name: item.name } });
    if (!menuItems[item.name]) menuItems[item.name] = await prisma.menuItem.create({ data: { ...item, categoryId: category.id, branchId: branch.id } });
  }
  const showcaseItems = [
    ["Tiger Beer Tower", 32, "🍺", "Alcohol"], ["Mojito", 9, "🍸", "Cocktails"],
    ["Cola", 3.5, "🥤", "Soft Drinks"], ["Sparkling Water", 4, "💧", "Water"],
    ["Karaoke Snack Platter", 24, "🍟", "Snacks"], ["Fresh Fruit Platter", 12, "🍉", "Fruit"],
    ["Chocolate Fondant", 8, "🍰", "Desserts"], ["Spicy Chicken Wings", 14, "🍗", "Fried & Rice"],
    ["Grilled Salmon", 24, "🍣", "Grilled"], ["Truffle Mushroom Pasta", 18.5, "🍝", "Mains"],
  ];
  for (const [name, price, emoji, categoryName] of showcaseItems) {
    const showcaseCategory = await prisma.menuCategory.upsert({ where: { branchId_name: { branchId: branch.id, name: categoryName } }, update: {}, create: { branchId: branch.id, name: categoryName } });
    const existing = await prisma.menuItem.findFirst({ where: { branchId: branch.id, name } });
    if (existing) await prisma.menuItem.update({ where: { id: existing.id }, data: { price, emoji, categoryId: showcaseCategory.id } });
    else await prisma.menuItem.create({ data: { name, price, emoji, categoryId: showcaseCategory.id, branchId: branch.id } });
  }

  const kitchenRooms = await prisma.room.findMany({ where: { branchId: branch.id }, orderBy: { name: "asc" } });
  const kitchenMenu = await prisma.menuItem.findMany({ where: { branchId: branch.id, name: { in: showcaseItems.map(item => item[0]) } }, orderBy: { name: "asc" } });
  const kitchenStatuses = ["NEW", "NEW", "NEW", "NEW", "PREPARING", "PREPARING", "PREPARING", "READY", "READY", "READY"];
  for (let index = 0; index < 10 && kitchenRooms.length && kitchenMenu.length; index++) {
    const orderNumber = `DEMO-KDS-${String(index + 1).padStart(3, "0")}`;
    if (await prisma.order.findUnique({ where: { orderNumber } })) continue;
    const first = kitchenMenu[index % kitchenMenu.length];
    const second = kitchenMenu[(index + 3) % kitchenMenu.length];
    const firstQuantity = index % 3 === 0 ? 2 : 1;
    const secondQuantity = index % 2 === 0 ? 1 : 2;
    const subtotal = Number(first.price) * firstQuantity + Number(second.price) * secondQuantity;
    const tax = Number((subtotal * 0.1).toFixed(2));
    await prisma.order.create({ data: {
      orderNumber, type: "ROOM", status: kitchenStatuses[index], subtotal, tax, total: subtotal + tax,
      notes: index % 3 === 0 ? "Karaoke room kitchen order" : null,
      branchId: branch.id, roomId: kitchenRooms[index % kitchenRooms.length].id,
      createdAt: new Date(Date.now() - (index + 2) * 3 * 60 * 1000),
      items: { create: [
        { quantity: firstQuantity, unitPrice: first.price, menuItemId: first.id, notes: index === 1 ? "Less spicy" : null },
        { quantity: secondQuantity, unitPrice: second.price, menuItemId: second.id },
      ] },
    } });
  }
  const inventoryExamples = [
    ["Chicken Breast","KITCHEN","Meat","kg",14,8,5.5], ["Pork","KITCHEN","Meat","kg",12,5,7], ["Beef Sirloin","KITCHEN","Meat","kg",7,6,12],
    ["Fresh Prawns","KITCHEN","Seafood","kg",5,6,10], ["Squid","KITCHEN","Seafood","kg",4,4,8],
    ["Tomatoes","KITCHEN","Vegetables","kg",12,8,2], ["Cauliflower","KITCHEN","Vegetables","pieces",10,5,1.8], ["Lettuce","KITCHEN","Vegetables","pieces",18,10,1.2],
    ["Fresh Milk","KITCHEN","Dairy","litres",9,6,1.5], ["Cheese","KITCHEN","Dairy","kg",3,2,8],
    ["Jasmine Rice","KITCHEN","Dry Goods","kg",30,15,1.3], ["Cooking Oil","KITCHEN","Dry Goods","litres",12,8,2.4],
    ["French Fries","KITCHEN","Frozen","kg",10,6,3],
    ["Beer Bottles","BAR","Alcohol","bottles",48,24,1.5], ["Whisky","BAR","Alcohol","bottles",8,6,14],
    ["Cola Cans","BAR","Soft Drinks","cans",72,36,.7], ["Soda Water","BAR","Soft Drinks","cans",30,18,.6],
    ["Orange Juice","BAR","Juices","litres",10,6,2.2], ["Lime Juice","BAR","Cocktails","litres",4,5,3],
    ["Mint Leaves","BAR","Garnishes","packs",6,4,1.5], ["Fresh Limes","BAR","Garnishes","pieces",28,20,.3],
    ["Ice Cubes","BAR","Cocktails","packs",20,12,1], ["Cocktail Glasses","BAR","Glassware","pieces",36,24,2.5],
  ];
  for (const [name,department,stockCategory,unit,quantity,parLevel,costPerUnit] of inventoryExamples) {
    await prisma.inventoryItem.upsert({ where: { branchId_name: { branchId: branch.id, name } }, update: { department, category: stockCategory, unit }, create: { name, department, category: stockCategory, unit, quantity, parLevel, costPerUnit, branchId: branch.id } });
  }
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  for (const [name,quantity] of [["Pork",5],["Cauliflower",5],["Beer Bottles",24],["Cola Cans",36]]) {
    const item = await prisma.inventoryItem.findFirst({ where: { branchId: branch.id, name } });
    const existingDailySupply = item && await prisma.stockMovement.findFirst({ where: { inventoryItemId: item.id, type: "RESTOCK", createdAt: { gte: todayStart } } });
    if (item && !existingDailySupply) await prisma.stockMovement.create({ data: { inventoryItemId: item.id, type: "RESTOCK", quantity, reason: `${item.department} daily supply example` } });
  }

  const rooms = await prisma.room.findMany({ where: { branchId: branch.id }, orderBy: { name: "asc" }, take: 2 });
  const ladies = await prisma.employee.findMany({ where: { branchId: branch.id, role: "LADY" }, orderBy: { name: "asc" }, take: 3 });
  const now = Date.now();
  if (rooms[0] && !(await prisma.order.findUnique({ where: { orderNumber: "DEMO-R1-001" } }))) {
    await prisma.order.create({ data: {
      orderNumber: "DEMO-R1-001", type: "ROOM", status: "PREPARING", subtotal: 70, tax: 7, total: 77,
      notes: "Room service demo order", branchId: branch.id, roomId: rooms[0].id,
      items: { create: [
        { quantity: 1, unitPrice: 32, menuItemId: menuItems["Tiger Beer Tower"].id },
        { quantity: 1, unitPrice: 24, menuItemId: menuItems["Karaoke Snack Platter"].id },
        { quantity: 1, unitPrice: 14, menuItemId: menuItems["Spicy Chicken Wings"].id },
      ] },
    } });
    await prisma.order.create({ data: {
      orderNumber: "DEMO-R1-002", type: "ROOM", status: "NEW", subtotal: 20, tax: 2, total: 22,
      notes: "Additional drinks", branchId: branch.id, roomId: rooms[0].id,
      items: { create: [
        { quantity: 1, unitPrice: 12, menuItemId: menuItems["Fresh Fruit Platter"].id },
        { quantity: 2, unitPrice: 4, menuItemId: menuItems["Sparkling Water"].id },
      ] },
    } });
  }
  if (rooms[1] && !(await prisma.order.findUnique({ where: { orderNumber: "DEMO-R2-001" } }))) {
    await prisma.order.create({ data: {
      orderNumber: "DEMO-R2-001", type: "ROOM", status: "PAID", subtotal: 60, tax: 6, total: 66,
      branchId: branch.id, roomId: rooms[1].id,
      items: { create: [
        { quantity: 1, unitPrice: 32, menuItemId: menuItems["Tiger Beer Tower"].id },
        { quantity: 2, unitPrice: 14, menuItemId: menuItems["Spicy Chicken Wings"].id },
      ] },
      payments: { create: { method: "CASH", amount: 66 } },
    } });
  }
  if (rooms[0] && ladies.length >= 2 && await prisma.roomSession.count({ where: { roomId: rooms[0].id } }) === 0) {
    await prisma.roomSession.create({ data: {
      roomId: rooms[0].id, startTime: new Date(now - 90 * 60 * 1000),
      assignments: { create: [
        { employeeId: ladies[0].id, startTime: new Date(now - 80 * 60 * 1000) },
        { employeeId: ladies[1].id, startTime: new Date(now - 70 * 60 * 1000), endTime: new Date(now - 15 * 60 * 1000) },
      ] },
    } });
    await prisma.room.update({ where: { id: rooms[0].id }, data: { status: "OCCUPIED", attendantCount: 2 } });
  }
  if (rooms[1] && ladies[2] && await prisma.roomSession.count({ where: { roomId: rooms[1].id } }) === 0) {
    await prisma.roomSession.create({ data: {
      roomId: rooms[1].id, startTime: new Date(now - 4 * 60 * 60 * 1000), endTime: new Date(now - 2 * 60 * 60 * 1000),
      assignments: { create: { employeeId: ladies[2].id, startTime: new Date(now - 225 * 60 * 1000), endTime: new Date(now - 130 * 60 * 1000) } },
    } });
    await prisma.room.update({ where: { id: rooms[1].id }, data: { status: "CLEANING", attendantCount: 1 } });
  }

  console.log(`Seeded ${accounts.length} RBAC accounts and karaoke room examples for ${branch.name}.`);
}

seed()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
