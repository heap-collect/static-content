import math
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

data = {
    'Week': ['2026-01-18','2026-01-25','2026-02-01','2026-02-08','2026-02-15','2026-02-22',
             '2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-03-29','2026-04-05','2026-04-12'],
    'MAS': [85,88,82,80,78,75,72,70,68,65,62,60,58],
    'Harness': [15,20,28,35,45,55,62,68,75,82,85,88,90],
    'Skills': [5,8,12,20,35,50,68,82,90,95,98,100,95],
    'Co-mentions': [10,15,22,30,42,55,68,78,85,90,92,95,93]
}

df = pd.DataFrame(data)
corr_matrix = df[['MAS','Harness','Skills','Co-mentions']].corr().round(2)

# Data-driven two-channel mapping:
#   * Positive correlations -> Blue channel only.
#     The observed positive range [pos_min, pos_max] is slerped onto [38, 255].
#   * Negative correlations -> Red channel only.
#     The magnitudes of the observed negative range are slerped onto [38, 255].
# Slerp here treats the two endpoints (38 and 255) as a unit great-circle arc
# of angle pi/2 and interpolates along it:
#     slerp(a, b, t) = a*cos(t*pi/2) + b*sin(t*pi/2)
vals = corr_matrix.values.flatten()
pos_vals = [v for v in vals if v > 0]
neg_mags = [abs(v) for v in vals if v < 0]
pos_min, pos_max = min(pos_vals), max(pos_vals)
neg_mag_min, neg_mag_max = min(neg_mags), max(neg_mags)

CH_LO, CH_HI = 38, 255  # channel bounds per user spec

def slerp(a, b, t):
    t = max(0.0, min(1.0, t))
    omega = math.pi / 2
    return a * math.cos(t * omega) + b * math.sin(t * omega)

def rgb_for_value(v):
    """Return (r, g, b) ints for a correlation value in [-1, 1]."""
    if v > 0:
        t = 0.0 if pos_max == pos_min else (v - pos_min) / (pos_max - pos_min)
        return (0, 0, round(slerp(CH_LO, CH_HI, t)))
    if v < 0:
        mag = abs(v)
        t = 0.0 if neg_mag_max == neg_mag_min else (mag - neg_mag_min) / (neg_mag_max - neg_mag_min)
        return (round(slerp(CH_LO, CH_HI, t)), 0, 0)
    return (0, 0, 0)

# Dense colorscale covering z in [-1, 1] so Plotly's Heatmap renders the
# piecewise slerp correctly at any z value.
N = 400
custom_scale = []
for i in range(N + 1):
    p = i / N                # position in [0, 1] along the colorbar
    z = 2 * p - 1            # corresponding z-value in [-1, 1]
    r, g, b = rgb_for_value(z)
    custom_scale.append([p, f"rgb({r},{g},{b})"])

# Heatmap
fig = go.Figure(data=go.Heatmap(
    z=corr_matrix.values,
    x=corr_matrix.columns,
    y=corr_matrix.columns,
    zmin=-1, zmax=1,
    colorscale=custom_scale,
    text=corr_matrix.values,
    texttemplate='%{text}',
    textfont={"size":16},
    hoverongaps=False))
fig.update_layout(title='Pairwise Correlation Heatmap (Strong Harness-Skills Convergence)', height=500)

# Add line overlay for co-mentions trend
fig2 = px.line(df, x='Week', y='Co-mentions', title='Co-mentions Ramp (Narrative Blending)')
fig2.update_traces(line=dict(color='green', width=4))

# Show both (or combine in subplot if desired)
fig.show()
fig2.show()
fig.write_html("correlation_heatmap.html")
fig2.write_html("comentions_ramp.html")
