"use client";
import React, { useState } from "react";
import OrderTrackingMenu from "@/components/OrderTrackingMenu";
import { useFetch } from "@/customHooks/useFetch";
import useSelection from "@/customHooks/useSelection"
import OrderReceiptManager, { Order } from "@/components/OrderReceiptManager";
import { SelectionObject } from "@/components/SelectionObject";
import OrderDetailsScreen, { OrderDetails } from "@/components/OrderDetailsScreen";
import TimeDropdown, { TimeDropdownProps } from "@/components/TimeDropdown";

export default function OrderTrackingPage() {
  const { currentSelection, isCurrentSelection, setCurrentSelection } = useSelection("Current Orders")
  
  let fetchString = "orders?"
  if(!isCurrentSelection("none")){
    const showCompletedOrders = isCurrentSelection("Completed Orders")
    fetchString = `orders?completed=${showCompletedOrders}&orderItemsDetails=true`
  }
  const { data } = useFetch<{ orders: Order[] }>(fetchString);
  console.log(data)
  const selObject: SelectionObject = {
    setCurrentSelection: setCurrentSelection,
    isCurrentSelection: isCurrentSelection
  }
  const [currentOrderDetails, setCurrentOrderDetails] = useState<Order | null>(null)
  const updateOrderDetails = (order: Order | null) => {
    setCurrentOrderDetails(order)
  }
  const orderDetailsObj: OrderDetails = {
    order: currentOrderDetails,
    updateOrderDetailsScreen: updateOrderDetails
  }

  const completedOrders: TimeDropdownProps = {
    orders: data?.orders,
    setOrderDetails: setCurrentOrderDetails
  }

  return (
    <div className="main-container">
      <h1 className="text-3xl font-bold text-center my-[0.5rem]">Order Tracking</h1>
      <OrderTrackingMenu {...selObject} />
      {(data?.orders.length !== undefined && data?.orders.length > 0) && <div className={`flex order-tracking-main-container max-w-[80dvw] justify-center mt-[20px]
        mobile:max-w-full mobile:mb-[4rem]
        `} >
          {isCurrentSelection("Current Orders") && <div key={currentSelection}
          className={`carousel max-h-[max-content] justify-start align-center overflow-x-auto p-[2rem] rounded-box bg-neutral
           gap-[1rem] carousel-start w-full scroll-smooth outline mobile:w-full mobile:carousel-vertical
           mobile:rounded-none mobile:items-center mobile:p-[2rem] tablet:pt-[10px] tablet:mb-[4rem]`}>
            {
              (data?.orders && data.orders.length) &&
                data?.orders.map((order)=>{
                  return <OrderReceiptManager key={order.orderid} {...order} />
                })
            }
        </div>} 
        {data && isCurrentSelection("Completed Orders") && <TimeDropdown {...completedOrders} />}
      </div>}
      {currentOrderDetails && <OrderDetailsScreen {...orderDetailsObj} />}
    </div>
  );
}
