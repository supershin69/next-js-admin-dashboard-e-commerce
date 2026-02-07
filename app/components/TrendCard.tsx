import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TrendCardProps from "../interfaces/trendCardProps";

const TrendCard = ({icon, amount, caption, percentage}: TrendCardProps) => {
  return (
    <div className="w-64 h-32 flex justify-center gap-8 items-center p-4 border rounded-lg shadow-sm">
      <div className="text-2xl text-blue-500">
        <FontAwesomeIcon icon={icon} />
      </div>
      
      <div className="flex flex-col items-end justify-center">
        <p className="text-xl font-bold">{amount}</p>
        <h3 className="text-gray-500 text-sm">{caption}</h3>
        {percentage !== undefined && (
          <p className={`text-sm ${percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {percentage > 0 ? `+${percentage}` : percentage}%
          </p>
        )}
      </div>
    </div>
  )
}
export default TrendCard;