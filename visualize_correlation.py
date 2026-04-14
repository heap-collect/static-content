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

# Heatmap
fig = go.Figure(data=go.Heatmap(
    z=corr_matrix.values,
    x=corr_matrix.columns,
    y=corr_matrix.columns,
    colorscale='RdBu',
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
