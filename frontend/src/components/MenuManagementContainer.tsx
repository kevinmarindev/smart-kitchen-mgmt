"use client";
import MenuItem,{MenuItemProps} from "./MenuItem";
import useSelection from "@/customHooks/useSelection";
import SelectableButton from "./SelectableButton";
import styles from "../styles/MenuManagementContainer.module.css"
import ViewMenuItemModal from '@/components/ViewMenuItemModal';
import {useState} from "react"


const menuCategories =
  "Popular, Meals, Entrees, Salads, Sides, Beverages".split(
    ","
  );
menuCategories.forEach((menuCategory) => menuCategory.trimStart());


export type MenuItemType = {
  name: string;
  price: string;
  category: string;
  isPopular: boolean;
  pictureUrl: string;
  menuitemid: string;
  menuitemingredients: Array<{
    ingredients: {
      ingredientname: string;
    }
  }>;
};

interface MenuManagementContainerProps {
  menuItems: MenuItemType[];
}

export type MenuItemDetails = {
  menuItem: MenuItemType;
}
export default function MenuManagementContainer({ menuItems }: MenuManagementContainerProps) {
  const { currentSelection, setCurrentSelection, isCurrentSelection } =
    useSelection();
  console.log(menuItems)
  const [itemSelected, setItemSelected] = useState<MenuItemProps | null>(null)
  const filteredMenuItems = 
  currentSelection === "none"
  ? menuItems
  : menuItems.filter(item => {
      const optionName = currentSelection.toLowerCase().trim();
      if (optionName === "popular") {
        return item.isPopular === true;
      }
      return item.category.toLowerCase() === optionName;
    });
  const itemClicked =(item?: MenuItemProps | null)=>{
   if(item) setItemSelected(item);
   else{
    setItemSelected(null)
   }
  }
  const turnOffItemModal=()=>{
    setItemSelected(null)
  }
  
  const itemSel: MenuItemProps ={
    modalToggle: turnOffItemModal,
    name: itemSelected?.name,
    price: itemSelected?.price,
    picture: itemSelected?.picture,
    ingredients: itemSelected?.ingredients,
    id: itemSelected?.id
  }
  return (
    <div className={`${styles["restaurant-main-food-menu-container"]} overflow-y-hidden flex-1`}>
      <div className={styles["restaurant-sub-menu-container"]}>
        {menuCategories.map((menuItem, index) => {
          return (
            <SelectableButton
              selected={isCurrentSelection(menuItem)}
              setCurrentSelection={setCurrentSelection}
              buttonClassName={styles["restaurant-sub-menu-button"]}
              text={menuItem.trimStart()}
              key={index}
            />
          );
        })}
      </div>
      {menuItems?.length > 0 && (
        <div className={styles["restaurant-main-food-menu-container"]}>
          <span className={styles["restaurant-current-option-title"]}>
            <span>{currentSelection === "none" ? "All" : currentSelection}</span> Menu
          </span>
          <div className={styles["current-menu-items-container"]}>
          {filteredMenuItems.map((menuItem, index) => {
              const itemInfo: MenuItemProps={
                name: menuItem.name,
                id: menuItem.menuitemid,
                price: Number(menuItem.price).toFixed(2),
                picture: menuItem.pictureUrl,
                ingredients: menuItem.menuitemingredients,
                updateItem: itemClicked
              }
              return(
                <MenuItem
                  key={index}              
                  {...itemInfo}
                />
              )
            }
          )}
          </div>
        </div>
      )}     
      {itemSelected && <ViewMenuItemModal {...itemSel}/>} 
    </div>
  );
}
