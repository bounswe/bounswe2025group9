import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { Food } from '../lib/apiClient';

interface MacroRadarChartProps {
    food1: Food;
    food2: Food;
    food3?: Food; // optional third item
}

interface MicronutrientRadarChartProps extends MacroRadarChartProps {
    nutrients: string[];
    chartType: 'vitamin' | 'mineral';
}

type MicronutrientUnit = 'mg' | 'ug' | 'g' | '';

type MicronutrientDatum = {
    nutrient: string;
    label?: string;
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

const colors = [
    { stroke: '#ff7f50', fill: '#8884d8' },
    { stroke: '#7fd8be', fill: '#0084d8' },
    { stroke: '#0000ff', fill: '#16a34a' },
];

const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
const stripParenthetical = (name: string) => name.replace(/\([^)]*\)/g, '').trim();
const stripParentheticalContent = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim();
const ANGLE_TICK_OFFSET = 22;

const renderAngleTick = ({ payload, x, y, cx, cy }: any) => {
    const dx = x - cx;
    const dy = y - cy;
    const radius = Math.sqrt(dx * dx + dy * dy) || 1;
    const factor = (radius + ANGLE_TICK_OFFSET) / radius;
    const newX = cx + dx * factor;
    const newY = cy + dy * factor;

    return (
        <text x={newX} y={newY} textAnchor="middle" fill="#6b7280" fontSize={12}>
            {payload.value}
        </text>
    );
};

const formatUnit = (unit?: string): MicronutrientUnit => {
    if (!unit) return '';
    const normalized = unit.toLowerCase();
    if (normalized === 'ug' || normalized === '\u00b5g') return 'ug';
    if (normalized === 'mg' || normalized === 'g') return normalized as MicronutrientUnit;
    return unit as MicronutrientUnit;
};

const formatAngleLabel = (nutrient: string, kind: 'macro' | 'vitamin' | 'mineral') => {
    if (kind === 'macro') {
        return stripParentheticalContent(nutrient);
    }
    if (kind === 'vitamin') {
        return stripParentheticalContent(nutrient);
    }
    // mineral: drop symbol (after comma)
    const [nameOnly] = nutrient.split(',');
    return nameOnly.trim();
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
const buildLegendItems = (foodList: Array<Food | undefined>) =>
    foodList
        .map((food, idx) => ({ food, idx }))
        .filter(({ food }) => !!food)
        .map(({ food, idx }) => ({
            name: food?.name || `Food ${idx + 1}`,
            color: colors[idx].stroke,
        }));

const MacroRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2, food3 }) => {
    const data = [
        {
            nutrient: 'Protein (g)',
            label: formatAngleLabel('Protein (g)', 'macro'),
            f1: toSigFigs(food1.proteinContent ? (food1.proteinContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.proteinContent ? (food2.proteinContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.proteinContent ? (food3.proteinContent / (food3.servingSize || 100)) * 100 : 0),
        },
        {
            nutrient: 'Fat (g)',
            label: formatAngleLabel('Fat (g)', 'macro'),
            f1: toSigFigs(food1.fatContent ? (food1.fatContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.fatContent ? (food2.fatContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.fatContent ? (food3.fatContent / (food3.servingSize || 100)) * 100 : 0),
        },
        {
            nutrient: 'Carbs (g)',
            label: formatAngleLabel('Carbs (g)', 'macro'),
            f1: toSigFigs(food1.carbohydrateContent ? (food1.carbohydrateContent / (food1.servingSize || 100)) * 100 : 0),
            f2: toSigFigs(food2.carbohydrateContent ? (food2.carbohydrateContent / (food2.servingSize || 100)) * 100 : 0),
            f3: toSigFigs(food3?.carbohydrateContent ? (food3.carbohydrateContent / (food3.servingSize || 100)) * 100 : 0),
        },
    ];

    const legendItems = buildLegendItems([food1, food2, food3]);

    return (
        <div style={{ width: '100%', maxWidth: '900px' }} className="space-y-3">
            <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="80%" margin={{ top: 36, right: 48, bottom: 36, left: 48 }}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="label" tick={renderAngleTick} tickLine={false} />
                        <PolarRadiusAxis angle={90} type="number" domain={[-10, 'dataMax']} tick={{ fontSize: 9 }} tickLine={false} />
                        <Tooltip />
                        <Radar name={food1?.name || 'Food 1'} dataKey="f1" stroke={colors[0].stroke} fill={colors[0].fill} fillOpacity={0} strokeWidth={2} />
                        <Radar name={food2?.name || 'Food 2'} dataKey="f2" stroke={colors[1].stroke} fill={colors[1].fill} fillOpacity={0} strokeWidth={2} />
                        {food3 && (
                            <Radar name={food3?.name || 'Food 3'} dataKey="f3" stroke={colors[2].stroke} fill={colors[2].fill} fillOpacity={0} strokeWidth={2} />
                        )}
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm nh-text">
                {legendItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="font-medium">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MicronutrientRadarChart: React.FC<MicronutrientRadarChartProps> = ({ food1, food2, food3, nutrients, chartType }) => {
    const data: MicronutrientDatum[] = nutrients.map((nutrient) => {
        const f1 = formatMicronutrientValue(food1, nutrient);
        const f2 = formatMicronutrientValue(food2, nutrient);
        const emptyMicronutrient: MicronutrientValue = { value: 0, unit: '', label: 'N/A' };
        const f3 = food3 ? formatMicronutrientValue(food3, nutrient) : emptyMicronutrient;
        const unit: MicronutrientUnit = f1.unit || f2.unit || f3.unit;
        const nutrientMax = Math.max(f1.value, f2.value, f3.value);
        const normalize = (val: number) => nutrientMax > 0 ? (val / nutrientMax) * 100 : 0;

        return {
            nutrient,
            label: formatAngleLabel(nutrient, chartType),
            f1: toSigFigs(normalize(f1.value), 3),
            f2: toSigFigs(normalize(f2.value), 3),
            f3: food3 ? toSigFigs(normalize(f3.value), 3) : undefined,
            unit,
            display: {
                f1: f1.label,
                f2: f2.label,
                ...(food3 ? { f3: f3.label } : {}),
            },
            actual: {
                f1: f1.label,
                f2: f2.label,
                ...(food3 ? { f3: f3.label } : {}),
            },
        };
    });

    const hasAnyData = data.some((d) => (d.f1 > 0 || d.f2 > 0 || (d.f3 ?? 0) > 0));
    const legendItems = buildLegendItems([food1, food2, food3]);

    if (!hasAnyData) {
        return (
            <div style={{ width: '100%', height: 360, maxWidth: '700px' }} className="flex items-center justify-center">
                <p className="nh-text text-sm text-center px-4">
                    Micronutrient data is not available for the selected foods.
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '900px' }} className="space-y-3">
            <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="80%" margin={{ top: 36, right: 48, bottom: 36, left: 48 }}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="label" tick={renderAngleTick} tickLine={false} />
                        <PolarRadiusAxis angle={90} type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} />
                        <Tooltip content={<MicronutrientTooltip />} />
                        <Radar name={food1?.name || 'Food 1'} dataKey="f1" stroke={colors[0].stroke} fill={colors[0].fill} fillOpacity={0} strokeWidth={2} />
                        <Radar name={food2?.name || 'Food 2'} dataKey="f2" stroke={colors[1].stroke} fill={colors[1].fill} fillOpacity={0} strokeWidth={2} />
                        {food3 && (
                            <Radar name={food3?.name || 'Food 3'} dataKey="f3" stroke={colors[2].stroke} fill={colors[2].fill} fillOpacity={0} strokeWidth={2} />
                        )}
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm nh-text">
                {legendItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="font-medium">{item.name}</span>
                    </div>
                ))}
            </div>
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

    return <MicronutrientRadarChart food1={food1} food2={food2} food3={food3} nutrients={vitaminKeys} chartType="vitamin" />;
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

    return <MicronutrientRadarChart food1={food1} food2={food2} food3={food3} nutrients={mineralKeys} chartType="mineral" />;
};

export default MacroRadarChart;
