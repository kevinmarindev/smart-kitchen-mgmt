import { NamedRouter } from "./index.js";
import { Router, Request, Response } from "express";
import { orders } from "@prisma/client";
// Prisma client renamed from prisma to Db to avoid confusion with the Prisma object
import { Db } from "@server/server.js";

const ordersRouter = Router() as NamedRouter;
ordersRouter.prefix = "orders";

ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { completed, orderItemsDetails } = req.query;
    console.log("Retrieving orders with status:", completed);
    console.log("Get order details:", orderItemsDetails);
    let orders: orders[] = [];
    if (
      (completed === "true" || completed === "false") &&
      orderItemsDetails === "false"
    ) {
      console.log("Retrieving orders with completed status:", completed);
      const completedBoolean = completed === "true";
      orders = await Db.orders.findMany({
        where: { completed: completedBoolean },
      });
    } else if (
      (completed === "true" || completed === "false") &&
      orderItemsDetails === "true"
    ) {
      console.log("Retrieving orders with completed status:", completed);
      console.log(
        "Retrieving orders with order items details:",
        orderItemsDetails
      );
      const completedBoolean = completed === "true";
      orders = await Db.orders.findMany({
        where: { completed: completedBoolean },
        select: {
          orderid: true,
          orderitems: {
            select: {
              orderitemid: true,
              served: true,
              servedtimestamp: true,
              returned: true,
              menuitems: {
                select: {
                  name: true,
                  price: true,
                },
              },
              customizationdetail: true,
            },
          },
          ordertimestamp: true,
          completedTimeStamp: true,
          completed: true,
        },
      });
    } else {
      console.log("Retrieving all orders");
      orders = await Db.orders.findMany();
    }

    res.status(200).json({
      orders: orders,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

ordersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    // This is a placeholder for the actual order retrieval logic
    const orderId = Number(req.params["id"]);
    const order = await Db.orders.findUnique({
      where: { orderid: orderId },
      select: {
        orderid: true,
        orderitems: {
          select: {
            orderitemid: true,
            served: true,
            servedtimestamp: true,
            returned: true,
            menuitems: {
              select: {
                name: true,
                price: true,
              },
            },
            customizationdetail: true,
          },
        },
        ordertimestamp: true,
        completed: true,
      },
    });

    res.status(200).json({
      order: order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// MIGHT REPLACE THIS WITH WEBSOCKET
ordersRouter.post("/", async (req: Request, res: Response) => {
  try {
    // This is a placeholder for the actual order creation logic
    const {
      orderItems,
    }: {
      orderItems: {
        foodName: string;
        foodPrice: number;
        quantity: number;
        id: number;
      }[];
    } = req.body;

    const expandedOrderItems = orderItems.flatMap(item => 
      Array(item.quantity).fill(null).map(() => ({
        menuitemid: item.id,
        customizationdetail: null,
      }))
    );

    await Db.orders.create({
      data: {
        orderitems: {
          createMany: {
            data: expandedOrderItems.map((item) => ({
              menuitemid: item.menuitemid,
              customizationdetail: item.customizationdetail,
            })),
          },
        },
      },
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

ordersRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params["id"]);
    console.log("Updating order with ID:", orderId);

    const order = await Db.orders.findUnique({
      where: { orderid: orderId },
      include: {
        orderitems: {
          include: {
            menuitems: {
              include: {
                menuitemingredients: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // update order status
    await Db.orders.update({
      where: { orderid: orderId },
      data: { 
        completed: !order.completed,
        completedTimeStamp: new Date(),
        orderitems: {
          updateMany: {
            where: { orderid: orderId },
            data: { served: true, servedtimestamp: new Date() },
          },
        },

       },
    });

    //this loop is for debugging purposes
    for (const orderItem of order.orderitems) {
      console.log("Updating stock for order item:", orderItem);
      console.log("Menu item", orderItem.menuitems.name);
      console.log(
        "Item has the following ingridients",
        orderItem.menuitems.menuitemingredients
      );
      for (const ingredient of orderItem.menuitems.menuitemingredients) {
        console.log("Ingredient to update stock for:", ingredient.ingredientid);
      }
    }

    await Db.$transaction(async (tx) => {
      //Collect stock update promises
      const updates = order.orderitems.flatMap((orderItem) =>
        orderItem.menuitems.menuitemingredients.map(async (ingredient) => {
          console.log(
            "Updating stock for ingredient:",
            ingredient.ingredientid
          );
          const stockToUpdate = await tx.stock.findFirst({
            where: {
              ingredientid: ingredient.ingredientid,
              isexpired: false,
            },
          });
          if (stockToUpdate) {
            console.log(
              "Stock updated for ingredient:",
              ingredient.ingredientid
            );
            return tx.$queryRaw`SELECT updateStock(CAST(${ingredient.ingredientid} AS INT), CAST(${ingredient.quantity} AS INT));`;
          }
          return null;
        })
      );
      //Trigger all stock updates at the same time
      await Promise.all(updates);
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default ordersRouter;
