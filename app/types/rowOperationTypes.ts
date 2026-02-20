import { CategoryModel } from "../interfaces/categoryModel";
import LowStockItem from "../interfaces/lowStockItem";
import PendingOrderModel from "../interfaces/pendingOrderModel";
import { UserModel } from "../interfaces/userModel";

export type PendingOrderActionHandler = {
  onEdit: (row: PendingOrderModel) => void;
  onDelete: (row: PendingOrderModel) => void;
};

export type LowStockItemActionHandler = {
    onEdit: (row: LowStockItem) => void;
    onDelete: (row: LowStockItem) => void;
}

export type UserActionHandler = {
    onEdit: (row: UserModel) => void;
    onDelete: (row: UserModel) => void;
}

export type CategoryActionHandler = {
    onEdit: (row: CategoryModel) => void;
    onDelete: (row: CategoryModel) => void;
}