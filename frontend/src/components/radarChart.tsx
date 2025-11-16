import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,Legend } from 'recharts';
import { Food } from '../lib/apiClient';

interface MacroRadarChartProps {
    food1: Food;
    food2: Food;
}
// Compare macronutrient values per 100g of two foods
const MacroRadarChart : React.FC<MacroRadarChartProps> = ({food1, food2}) => {
    const food1servingSize = food1.servingSize ;
    const food2servingSize = food2.servingSize ;

    console.log("Food1:", food1);

    // preprocess Food data here to fit the structure needed by RadarChart
    let data = [
        {
            nutritient: 'Protein',
            f1: (food1.proteinContent / food1servingSize)*100,
            f2: (food2.proteinContent / food2servingSize)*100,
            fullMark: 100,
        },
        {
            nutritient: 'Fat',
            f1: (food1.fatContent / food1servingSize)*100,
            f2: (food2.fatContent / food2servingSize)*100,
            fullMark: 100,
        },
        {
            nutritient: 'Carb',
            f1: (food1.carbohydrateContent / food1servingSize)*100,
            f2: (food2.carbohydrateContent / food2servingSize)*100,
            fullMark: 100,
        },
    ];

  return (
    <RadarChart
      style={{ width: '100%', height: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
      responsive
      outerRadius="80%"
      data={data}
      margin={{
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
      }}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="nutritient" />
      <PolarRadiusAxis angle={90}/>
      <Radar name={food1.name} dataKey="f1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      <Radar name={food2.name} dataKey="f2" stroke="#0084d8" fill="#0084d8" fillOpacity={0.6} />
      <Legend />
    </RadarChart>
  );
};

export default MacroRadarChart;