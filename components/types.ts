export type Task = {
    id: string;
    title: string;
    description: string;
    status: "TO_DO" | "IN_PROGRESS" | "DONE";
};
export type Columns = {
    id: "TO_DO" | "IN_PROGRESS" | "DONE";
    title: string;
};