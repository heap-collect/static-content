import pandas as pd
import plotly.express as px

data = {
    'Week': ['2026-01-18','2026-01-25','2026-02-01','2026-02-08','2026-02-15','2026-02-22',
             '2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-03-29','2026-04-05','2026-04-12'],
    'MAS': [85,88,82,80,78,75,72,70,68,65,62,60,58],
    'Harness': [15,20,28,35,45,55,62,68,75,82,85,88,90],
    'Skills': [5,8,12,20,35,50,68,82,90,95,98,100,95],
    'Co-mentions': [10,15,22,30,42,55,68,78,85,90,92,95,93]
}
df = pd.DataFrame(data)

fig = px.line(df, x='Week', y=['MAS','Harness','Skills','Co-mentions'],
              markers=True, title='MAS vs Harness vs Skills Mention Frequency + Co-mentions (Jan-Apr 2026)',
              labels={'value': 'Normalized Frequency (0-100)', 'variable': 'Term'})
fig.update_layout(hovermode='x unified', legend_title='Concept', height=600)
fig.show()  # Opens fully interactive chart in browser
fig.write_html("mas_harness_skills_trends.html")  # Saves standalone HTML
