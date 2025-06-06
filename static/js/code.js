document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');

    analyzeBtn.addEventListener('click', () => {
        const sentence = document.getElementById('textInput').value.trim();
        const selectedTask = document.querySelector('input[name="taskRadio"]:checked').value;

        if (!sentence) {
            alert("Veuillez entrer une phrase !");
            return;
        }

        if (selectedTask === 'pos') {
            fetch('/predict_pos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentence: sentence })
            })
            .then(response => {
                if (!response.ok) throw new Error("Erreur serveur");
                return response.json();
            })
            .then(data => {
                const words = data.words;
                const tags = data.tags;

                let html = '<ul style="list-style: none; padding: 0;">';
                for (let i = 0; i < words.length; i++) {
                    html += `<li><strong>${words[i]}</strong> → ${tags[i]}</li>`;
                }
                html += '</ul>';

                document.getElementById('nerResult').style.display = 'none';
                document.getElementById('corefResult').style.display = 'none';
                document.getElementById('posResult').style.display = 'block';
                document.getElementById('posDisplay').innerHTML = html;
                document.getElementById('resultContainer').style.display = 'block';
            })
            .catch(err => {
                console.error("Erreur JS:", err);
                alert("Une erreur est survenue pendant l'analyse.");
            });
        }
        else if (selectedTask === 'ner') {
            fetch('/predict_ner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentence: sentence })
            })
            .then(response => {
                if (!response.ok) throw new Error("Erreur serveur");
                return response.json();
            })
            .then(data => {
            console.log("Données reçues:", data);
            const tagged_sentence = data.tagged_sentence; 
            const taggedHtml = tagged_sentence.map(({word, tag}) => {
                const color = tag === 'O' ? '#7f8c8d' : '#e74c3c'; 
                return `<div style="padding: 4px 6px; border-radius: 4px; background-color: ${color}; color: white; margin-bottom: 4px; width: fit-content;">
                            ${word} → ${tag}
                        </div>`;
            }).join('');

            document.getElementById('nerDisplay').innerHTML = `<p>${taggedHtml}</p>`;

            document.getElementById('posResult').style.display = 'none';
            document.getElementById('corefResult').style.display = 'none';
            document.getElementById('nerResult').style.display = 'block';
            document.getElementById('resultContainer').style.display = 'block';
        })

            .catch(err => {
                console.error("Erreur JS:", err);
                alert("Une erreur est survenue pendant l'analyse.");
            });
        }
        else if (selectedTask === 'coref') {
            fetch('/predict_coreference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sentence: sentence,
                    threshold: 0.7  
                })
            })
            .then(response => {
                if (!response.ok) throw new Error("Erreur serveur");
                return response.json();
            })
            .then(data => {
                console.log("Données coréférence reçues:", data);
        
                const corefPairs = data.coreference_pairs;
                const totalPairs = data.total_pairs;
                const threshold = data.threshold_used;
        
                let html = '';
        
                if (totalPairs === 0) {
                    html = `<div style="text-align: center; color: #7f8c8d; padding: 20px;">
                                <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                                <p>Aucune coréférence détectée au-dessus du seuil ${threshold}.</p>
                            </div>`;
                } else {
                    html = `<div style="margin-bottom: 15px;">
                                <h4 style="color: #2c3e50; margin-bottom: 10px;">
                                    <i class="fas fa-link"></i> ${totalPairs} coréférence(s) trouvée(s) (seuil: ${threshold})
                                </h4>
                            </div>`;
            
                    corefPairs.forEach((pair, index) => {
                        const mention1 = pair.mention1;
                        const mention2 = pair.mention2;
                        const score = (pair.score * 100).toFixed(2);  
                        
                        let scoreColor = '#e74c3c';
                        if (score >= 50) scoreColor = '#27ae60'; 
                        else if (score >= 20) scoreColor = '#f39c12'; 
                        else if (score >= 5) scoreColor = '#9b59b6'; 
                
                        html += `
                            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background-color: #f9f9f9;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="font-weight: bold; color: #2c3e50;">Paire ${index + 1}</span>
                                    <span style="background-color: ${scoreColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                        ${score}% confiance
                                    </span>
                                </div>
                        
                                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                    <div style="flex: 1; min-width: 200px;">
                                        <div style="background-color: #3498db; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px;">
                                            <strong>"${mention1.text}"</strong>
                                        </div>
                                        <small style="color: #7f8c8d;">
                                            Type: ${mention1.label} | Position: ${mention1.start}-${mention1.end}
                                        </small>
                                    </div>
                            
                                    <div style="text-align: center; color: #2c3e50;">
                                        <i class="fas fa-arrows-alt-h" style="font-size: 18px;"></i>
                                        <div style="font-size: 12px; margin-top: 5px;">
                                            ${score < 10 ? 'Score faible' : score < 50 ? 'coréfère peut-être' : 'coréfère avec'}
                                        </div>
                                    </div>
                                    
                                    <div style="flex: 1; min-width: 200px;">
                                        <div style="background-color: #e74c3c; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px;">
                                            <strong>"${mention2.text}"</strong>
                                        </div>
                                        <small style="color: #7f8c8d;">
                                            Type: ${mention2.label} | Position: ${mention2.start}-${mention2.end}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
        
                document.getElementById('corefDisplay').innerHTML = html;
        
                document.getElementById('posResult').style.display = 'none';
                document.getElementById('nerResult').style.display = 'none';
                document.getElementById('corefResult').style.display = 'block';
                document.getElementById('resultContainer').style.display = 'block';
            })
            .catch(err => {
                console.error("Erreur JS coréférence:", err);
                alert("Une erreur est survenue pendant l'analyse de coréférence.");
            });
        }

    });
});
