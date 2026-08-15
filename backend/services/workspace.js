import prisma from "../database/prisma.js";

const menuSeed = [
  ["Truffle Mushroom Pasta", "Mains", 18.5, "🍝"], ["Grilled Salmon", "Mains", 24, "🍣"],
  ["Classic Cheeseburger", "Mains", 16, "🍔"], ["Garden Salad", "Starters", 9.5, "🥗"],
  ["Margherita Pizza", "Mains", 15, "🍕"], ["Iced Caramel Latte", "Drinks", 6.5, "🥤"],
  ["Chocolate Fondant", "Desserts", 8, "🍰"], ["Sparkling Water", "Drinks", 4, "💧"],
];

export async function getBranchId(userId) {
  let user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
  if (user?.branchId) return user.branchId;

  const restaurant = await prisma.restaurant.create({ data: { name: "Lumora Restaurant", branches: { create: { name: "Riverside Kitchen" } } }, include: { branches: true } });
  const branchId = restaurant.branches[0].id;
  await prisma.user.update({ where: { id: userId }, data: { branchId } });

  const categories = {};
  for (const name of ["Starters", "Mains", "Drinks", "Desserts"]) {
    categories[name] = await prisma.menuCategory.create({ data: { name, branchId } });
  }
  await prisma.menuItem.createMany({ data: menuSeed.map(([name, category, price, emoji]) => ({ name, price, emoji, categoryId: categories[category].id, branchId })) });
  await prisma.diningTable.createMany({ data: Array.from({ length: 12 }, (_, index) => ({ name: `Table ${index + 1}`, seats: index % 3 === 0 ? 4 : 2, branchId })) });
  await prisma.room.createMany({ data: [
    { name: "Room1", floorNumber: 1, capacity: 6, hourlyRate: 18, branchId },
    { name: "Room2", floorNumber: 1, capacity: 8, hourlyRate: 24, branchId },
    { name: "Room3", floorNumber: 2, capacity: 12, hourlyRate: 35, branchId },
    { name: "Room4", floorNumber: 2, capacity: 16, hourlyRate: 48, branchId },
  ] });
  await prisma.inventoryItem.createMany({ data: [
    { name: "Atlantic Salmon", category: "Seafood", unit: "kg", quantity: 8.2, parLevel: 12, costPerUnit: 18, branchId },
    { name: "Truffle Paste", category: "Pantry", unit: "kg", quantity: 1.1, parLevel: 4, costPerUnit: 42, branchId },
    { name: "Coffee Beans", category: "Beverages", unit: "kg", quantity: 6.4, parLevel: 8, costPerUnit: 15, branchId },
    { name: "Avocado", category: "Produce", unit: "units", quantity: 12, parLevel: 40, costPerUnit: 1.2, branchId },
    { name: "Sparkling Water", category: "Beverages", unit: "bottles", quantity: 84, parLevel: 100, costPerUnit: 0.8, branchId },
  ] });
  await prisma.employee.createMany({ data: [["Maya Chen", "MANAGER"], ["Jon Lee", "CASHIER"], ["Ana Silva", "KITCHEN"], ["Ravi Kumar", "SERVER"], ["Nina Rose", "LADY"], ["Sofia Tran", "LADY"], ["Mia Chen", "LADY"]].map(([name, role]) => ({ name, role, branchId, hourlyRate: 15 })) });
  await prisma.customer.createMany({ data: [["Olivia Lane",1240],["Noah Williams",980],["Emma Stone",840],["Liam Hall",720]].map(([name, loyaltyPoints]) => ({ name, loyaltyPoints, branchId })) });

  const salmon = await prisma.inventoryItem.findFirst({ where: { branchId, name: "Atlantic Salmon" } });
  const salmonDish = await prisma.menuItem.findFirst({ where: { branchId, name: "Grilled Salmon" } });
  if (salmon && salmonDish) await prisma.recipeIngredient.create({ data: { menuItemId: salmonDish.id, inventoryItemId: salmon.id, quantity: 0.25 } });
  return branchId;
}
