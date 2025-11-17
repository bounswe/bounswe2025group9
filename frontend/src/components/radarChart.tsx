import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip } from 'recharts';
import { Food } from '../lib/apiClient';



interface MacroRadarChartProps {
    food1: Food;
    food2: Food;
    food3?: Food; // optional third item
}

// Format number to 2 significant figures
const toSigFigs = (num: number, sig: number = 2): number => {
    if (num === 0) return 0;
    return parseFloat(num.toPrecision(sig));
};

// Compare macronutrient values per 100g of up to three foods
const MacroRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {


    // prepare data normalized to per 100g
    const data = [
        {
            nutrient: 'Protein (g)',
            f1: toSigFigs(food1.proteinContent ? (food1.proteinContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.proteinContent ? (food2.proteinContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.proteinContent ? (food3.proteinContent / (food3.servingSize || 100)) * 100 : 0),
        },
        { 
            nutrient: 'Fat (g)',
            f1: toSigFigs(food1.fatContent ? (food1.fatContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.fatContent ? (food2.fatContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.fatContent ? (food3.fatContent / (food3.servingSize || 100)) * 100 : 0),
        },
        { 
            nutrient: 'Carbs (g)',
            f1: toSigFigs(food1.carbohydrateContent ? (food1.carbohydrateContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.carbohydrateContent ? (food2.carbohydrateContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.carbohydrateContent ? (food3.carbohydrateContent / (food3.servingSize || 100)) * 100 : 0),
        },
    ];

    const colors = [
        { stroke: '#8884d8', fill: '#8884d8' },
        { stroke: '#0084d8', fill: '#0084d8' },
        { stroke: '#16a34a', fill: '#16a34a' },
    ];

    return (
        <div style={{ width: '100%', height: 360, maxWidth: '700px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data} outerRadius="80%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="nutrient" />
                    <PolarRadiusAxis angle={90}/>
                    <Tooltip />
                    <Radar name={food1?.name || 'Food 1'} dataKey="f1" stroke={colors[0].stroke} fill={colors[0].fill} fillOpacity={0.6} />
                    <Radar name={food2?.name || 'Food 2'} dataKey="f2" stroke={colors[1].stroke} fill={colors[1].fill} fillOpacity={0.6} />
                    {food3 && (
                        <Radar name={food3?.name || 'Food 3'} dataKey="f3" stroke={colors[2].stroke} fill={colors[2].fill} fillOpacity={0.6} />
                    )}
                    <Legend verticalAlign="bottom" />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MacroRadarChart;