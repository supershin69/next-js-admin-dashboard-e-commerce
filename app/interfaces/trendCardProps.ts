import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export default interface TrendCardProps {
    icon: IconDefinition
    amount: number
    caption: string
    percentage?: number
}