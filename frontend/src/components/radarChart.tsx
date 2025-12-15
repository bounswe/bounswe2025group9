import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip } from 'recharts';
import { Food } from '../lib/apiClient';
import { useLanguage } from '../context/LanguageContext';

interface MacroRadarChartProps {
    food1: Food;
    food2: Food;
    food3?: Food; // optional third item
}

interface MicronutrientRadarChartProps extends MacroRadarChartProps {
    nutrients: string[];
}

type MicronutrientUnit = 'mg' | 'ug' | 'g' | '';

type MicronutrientDatum = {
    nutrient: string;
    f1: number;
    f2: number;
    f3?: number;
    actual?: {
        f1?: string;
        f2?: string;
        f3?: string;
    };
    unit?: MicronutrientUnit;
    display?: {
        f1?: string;
        f2?: string;
        f3?: string;
    };
};

type MicronutrientValue = {
    value: number;
    unit: MicronutrientUnit;
    label: string;
};

// Format number to significant figures to keep tooltips compact
const toSigFigs = (num: number, sig: number = 2): number => {
    if (num === 0) return 0;
    return parseFloat(num.toPrecision(sig));
};

// Compare macronutrient values per 100g of up to three foods
const MacroRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {
    const { t } = useLanguage();
const colors = [
    { stroke: '#ff7f50', fill: '#8884d8' },
    { stroke: '#7fd8be', fill: '#0084d8' },
    { stroke: '#0000ff', fill: '#16a34a' },
];

const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
const stripParenthetical = (name: string) => name.replace(/\([^)]*\)/g, '').trim();

const formatUnit = (unit?: string): MicronutrientUnit => {
    if (!unit) return '';
    const normalized = unit.toLowerCase();
    if (normalized === 'ug' || normalized === '\u00b5g') return 'ug';
    if (normalized === 'mg' || normalized === 'g') return normalized as MicronutrientUnit;
    return unit as MicronutrientUnit;
};

const getMicronutrientEntry = (food: Food | undefined, nutrient: string) => {
    if (!food?.micronutrients) return undefined;
    if (food.micronutrients[nutrient]) return food.micronutrients[nutrient];

    const targetNormalized = normalizeName(nutrient);
    const targetStripped = normalizeName(stripParenthetical(nutrient));

    const matchKey = Object.keys(food.micronutrients).find(
        (key) => {
            const normalizedKey = normalizeName(key);
            const strippedKey = normalizeName(stripParenthetical(key));
            return (
                normalizedKey === targetNormalized ||
                strippedKey === targetStripped ||
                strippedKey === targetNormalized ||
                normalizedKey === targetStripped
            );
        }
    );

    return matchKey ? food.micronutrients[matchKey] : undefined;
};

const formatMicronutrientValue = (food: Food | undefined, nutrient: string, sig = 3): MicronutrientValue => {
    const entry = getMicronutrientEntry(food, nutrient);
    if (!food || !entry) {
        return { value: 0, unit: '' as MicronutrientUnit, label: 'N/A' };
    }

    const per100g = (entry.value / (food.servingSize || 100)) * 100;
    const unit = formatUnit(entry.unit);
    const formatted = per100g >= 1 ? per100g.toFixed(2) : per100g.toPrecision(3);
    const unitLabel = unit ? ` ${unit}` : '';
    return {
        value: toSigFigs(per100g, sig),
        unit,
        label: `${formatted}${unitLabel}/100g`,
    };
};

const MicronutrientTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload as MicronutrientDatum;

    return (
        <div className="nh-card p-3 shadow-sm">
            <p className="font-semibold mb-2">{data.nutrient}{data.unit ? ` (${data.unit}/100g)` : ''}</p>
            <div className="space-y-1 text-sm">
                {payload.map((item: any) => (
                    <div key={item.dataKey} className="flex items-center justify-between gap-4">
                        <span style={{ color: item.color }}>{item.name}</span>
                        <span className="font-medium">
                            {data.display?.[item.dataKey as 'f1' | 'f2' | 'f3'] ?? `${item.value}${data.unit ? ` ${data.unit}` : ''}`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Compare macronutrient values per 100g of up to three foods
const MacroRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {
    const data = [
        {
            nutrient: `${t('food.protein')} (g)`,
            f1: toSigFigs(food1.proteinContent ? (food1.proteinContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.proteinContent ? (food2.proteinContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.proteinContent ? (food3.proteinContent / (food3.servingSize || 100)) * 100 : 0),
        },
        { 
            nutrient: `${t('food.fat')} (g)`,
            f1: toSigFigs(food1.fatContent ? (food1.fatContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.fatContent ? (food2.fatContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.fatContent ? (food3.fatContent / (food3.servingSize || 100)) * 100 : 0),
        },
        { 
            nutrient: `${t('food.carbs')} (g)`,
            f1: toSigFigs(food1.carbohydrateContent ? (food1.carbohydrateContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.carbohydrateContent ? (food2.carbohydrateContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.carbohydrateContent ? (food3.carbohydrateContent / (food3.servingSize || 100)) * 100 : 0),
        },
    ];

    return (
        <div style={{ width: '100%', height: 360, maxWidth: '700px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data} outerRadius="80%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="nutrient" />
                    <PolarRadiusAxis angle={90} type="number" domain={[-10, 'dataMax']} />
                    <Tooltip />
                    <Radar name={food1?.name || t('food.food1')} dataKey="f1" stroke={colors[0].stroke} fill={colors[0].fill} fillOpacity={0} strokeWidth={2} />
                    <Radar name={food2?.name || t('food.food2')} dataKey="f2" stroke={colors[1].stroke} fill={colors[1].fill} fillOpacity={0} strokeWidth={2} />
                    {food3 && (
                        <Radar name={food3?.name || t('food.food3')} dataKey="f3" stroke={colors[2].stroke} fill={colors[2].fill} fillOpacity={0} strokeWidth={2}  />
                    )}
                    <Legend verticalAlign="bottom" />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const VitaminRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {
    const vitaminKeys = [
        'Vitamin A, RAE',
        'Vitamin B-12',
        'Vitamin B-6',
        'Vitamin C',
        'Vitamin D (D2 + D3)',
        'Vitamin E (alpha-tocopherol)',
        'Vitamin K (phylloquinone)',
        'Folate, DFE',
    ];

    return <MicronutrientRadarChart food1={food1} food2={food2} food3={food3} nutrients={vitaminKeys} />;
};

export const MineralRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {
    const mineralKeys = [
        'Calcium, Ca',
        'Iron, Fe',
        'Magnesium, Mg',
        'Potassium, K',
        'Sodium, Na',
        'Zinc, Zn',
        'Phosphorus, P',
        'Selenium, Se',
    ];

    return <MicronutrientRadarChart food1={food1} food2={food2} food3={food3} nutrients={mineralKeys} />;
};

export default MacroRadarChart;
