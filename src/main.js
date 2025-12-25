import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import katex from 'katex';
import 'katex/dist/katex.css';

// Application state
let currentData = null;
let currentPoints = [];
let selectedIndices = [];
let lassoPoints = [];
let isDrawing = false;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let selectedChannels = [];
let filtersByChannelPair = new Map();
let filterIndices = [];
let showPastFilters = false;
let excludedPoints = new Set();

// DOM elements
const loadBtn = document.getElementById('loadBtn');
const exportBtn = document.getElementById('exportBtn');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');
const plotContainer = document.getElementById('plotContainer');
const plotCanvas = document.getElementById('plotCanvas');
const plotTitle = document.getElementById('plotTitle');
const confirmBtn = document.getElementById('confirmSelectionBtn');
const clearBtn = document.getElementById('clearSelectionBtn');
const exportFormat = document.getElementById('exportFormat');
const xAxisLogScale = document.getElementById('xAxisLogScale');
const yAxisLogScale = document.getElementById('yAxisLogScale');
const axisLabelsContainer = document.getElementById('axisLabelsContainer');
const themeSelect = document.getElementById('themeSelect');
const showPastFiltersCheckbox = document.getElementById('showPastFilters');
const filterSummary = document.getElementById('filterSummary');
const resetFilterBtn = document.getElementById('resetFilterBtn');

const ctx = plotCanvas.getContext('2d');

// Initialize canvas
function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = plotCanvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 800;
    const height = rect.height > 0 ? rect.height : 600;
    
    plotCanvas.width = width * dpr;
    plotCanvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    plotCanvas.style.width = width + 'px';
    plotCanvas.style.height = height + 'px';
}

setupCanvas();
window.addEventListener('resize', () => {
    setupCanvas();
    if (currentPoints.length > 0) {
        requestAnimationFrame(() => drawPlot());
    }
});

// Status messages
function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
}

function hideStatus() {
    status.classList.add('hidden');
}

// Load FCS file
loadBtn.addEventListener('click', async () => {
    try {
        const file = await open({
            filters: [{ name: 'FCS Files', extensions: ['fcs', 'FCS'] }],
            multiple: false
        });
        
        if (!file) return;
        
        showStatus('Loading FCS file...', 'info');
        const filePath = typeof file === 'string' ? file : file.path || file;
        
        if (!filePath) {
            showStatus('Error: No file path received', 'warning');
            return;
        }
        
        try {
            currentData = await invoke('load_fcs_file', { filePath });
        } catch (error) {
            console.error('Error loading file:', error);
            showStatus(`Error loading file: ${error}`, 'warning');
            return;
        }
        
        document.getElementById('fileName').textContent = currentData.filepath.split('/').pop();
        const channels = currentData.channels.filter(c => c !== 'Time');
        const eventCount = currentData.data[currentData.channels[0]]?.length || 0;
        
        document.getElementById('channelCount').textContent = channels.length;
        document.getElementById('eventCount').textContent = eventCount.toLocaleString();
        
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '';
        channels.forEach(channel => {
            const tag = document.createElement('span');
            tag.className = 'channel-tag';
            tag.textContent = channel;
            tag.dataset.channel = channel;
            tag.style.cursor = 'pointer';
            tag.addEventListener('click', () => selectChannel(channel, tag));
            channelsList.appendChild(tag);
        });
        
        fileInfo.classList.remove('hidden');
        showStatus(`Loaded ${eventCount.toLocaleString()} events from ${channels.length} channels`, 'success');
        
        filterIndices = [];
        exportBtn.disabled = true;
        filtersByChannelPair.clear();
        showPastFiltersCheckbox.checked = false;
        filterSummary.style.display = 'none';
        
        if (channels.length >= 2) {
            selectedChannels = [channels[0], channels[1]];
            updateChannelSelection();
            await loadPlotData(channels[0], channels[1]);
        } else if (channels.length === 1) {
            showStatus('Only one channel available. Need at least two channels to plot.', 'warning');
        }
    } catch (error) {
        showStatus(`Error: ${error}`, 'warning');
        console.error(error);
    }
});

// Select channel
function selectChannel(channel, element) {
    if (!currentData) return;
    
    const index = selectedChannels.indexOf(channel);
    if (index === -1) {
        if (selectedChannels.length < 2) {
            selectedChannels.push(channel);
        } else {
            selectedChannels[0] = selectedChannels[1];
            selectedChannels[1] = channel;
        }
    } else {
        selectedChannels.splice(index, 1);
    }
    
    updateChannelSelection();
    
    if (selectedChannels.length === 2) {
        loadPlotData(selectedChannels[0], selectedChannels[1]);
    } else if (selectedChannels.length === 0) {
        plotContainer.classList.add('hidden');
        currentPoints = [];
        lassoPoints = [];
        selectedIndices = [];
    }
}

function updateChannelSelection() {
    document.querySelectorAll('.channel-tag').forEach(tag => {
        const channel = tag.dataset.channel;
        if (selectedChannels.includes(channel)) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
}

// Load plot data
async function loadPlotData(xChannel, yChannel) {
    if (!currentData) return;
    
    const channelPair = `${xChannel}|${yChannel}`;
    const hasExistingFilter = filtersByChannelPair.has(channelPair);
    
    if (hasExistingFilter) {
        document.getElementById('existingFilterWarning').style.display = 'block';
    } else {
        document.getElementById('existingFilterWarning').style.display = 'none';
    }
    
    try {
        currentPoints = await invoke('get_data_points', {
            filePath: currentData.filepath,
            xChannel,
            yChannel
        });
        
        if (currentPoints.length === 0) {
            showStatus(`No data points found for ${xChannel} vs ${yChannel}`, 'warning');
            return;
        }
        
        plotTitle.textContent = `${xChannel} vs ${yChannel} - Select region to keep`;
        plotContainer.style.display = 'block';
        plotContainer.classList.remove('hidden');
        
        if (hasExistingFilter) {
            const filterIndex = filtersByChannelPair.get(channelPair);
            selectedIndices = [...filterIndices[filterIndex]];
        } else {
            lassoPoints = [];
            selectedIndices = [];
        }
        
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        updateFilterSummary();
        requestAnimationFrame(() => {
            setupCanvas();
            drawPlot();
            showStatus(`Select region on ${xChannel} vs ${yChannel} plot`, 'info');
        });
    } catch (error) {
        showStatus(`Error loading data: ${error}`, 'warning');
        console.error(error);
    }
}

// Drawing functions (simplified - full implementation would be much longer)
function drawPlot() {
    if (!currentPoints || currentPoints.length === 0) return;
    
    setupCanvas();
    const dpr = window.devicePixelRatio || 1;
    const margin = 60;
    const width = plotCanvas.width / dpr;
    const height = plotCanvas.height / dpr;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;
    
    ctx.clearRect(0, 0, width, height);
    
    // Get data ranges
    const xLog = xAxisLogScale.checked;
    const yLog = yAxisLogScale.checked;
    
    let xData, yData, xMin, xMax, yMin, yMax;
    
    if (xLog) {
        xData = currentPoints.map(p => p.x).filter(x => x > 0);
        if (xData.length === 0) return;
        xMin = Math.log10(Math.min(...xData));
        xMax = Math.log10(Math.max(...xData));
    } else {
        xData = currentPoints.map(p => p.x);
        xMin = Math.min(...xData);
        xMax = Math.max(...xData);
    }
    
    if (yLog) {
        yData = currentPoints.map(p => p.y).filter(y => y > 0);
        if (yData.length === 0) return;
        yMin = Math.log10(Math.min(...yData));
        yMax = Math.log10(Math.max(...yData));
    } else {
        yData = currentPoints.map(p => p.y);
        yMin = Math.min(...yData);
        yMax = Math.max(...yData);
    }
    
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const scaledXRange = xRange / zoomLevel;
    const scaledYRange = yRange / zoomLevel;
    const centerX = (xMin + xMax) / 2 + panX * xRange;
    const centerY = (yMin + yMax) / 2 + panY * yRange;
    const viewXMin = centerX - scaledXRange / 2;
    const viewXMax = centerX + scaledXRange / 2;
    const viewYMin = centerY - scaledYRange / 2;
    const viewYMax = centerY + scaledYRange / 2;
    
    // Draw gridlines and axes
    const isDark = document.body.getAttribute('data-theme') === 'dark' || document.body.getAttribute('data-theme') === 'dim';
    const gridColor = isDark ? '#8b949e' : '#999';
    const axisColor = isDark ? '#c9d1d9' : '#333';
    
    // Draw gridlines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // X-axis gridlines
    if (xLog) {
        const xGridRange = viewXMax - viewXMin;
        let increment = 1;
        if (xGridRange < 2 && zoomLevel > 0.3) {
            increment = 0.2;
        }
        for (let val = Math.floor(viewXMin / increment) * increment; val <= viewXMax; val += increment) {
            if (Math.abs(val - Math.round(val)) > 0.01 || val === Math.round(val)) {
                const x = margin + (val - viewXMin) / (viewXMax - viewXMin) * plotWidth;
                if (x >= margin && x <= width - margin) {
                    ctx.beginPath();
                    ctx.moveTo(x, margin);
                    ctx.lineTo(x, height - margin);
                    ctx.stroke();
                }
            }
        }
    } else {
        const numGridLines = Math.max(3, Math.min(20, Math.floor(8 * zoomLevel)));
        const xIncrement = (viewXMax - viewXMin) / numGridLines;
        const xPower = Math.pow(10, Math.floor(Math.log10(xIncrement)));
        const xStep = Math.ceil(xIncrement / xPower) * xPower;
        const xStart = Math.floor(viewXMin / xStep) * xStep;
        for (let val = xStart; val <= viewXMax; val += xStep) {
            const x = margin + (val - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            if (x >= margin && x <= width - margin) {
                ctx.beginPath();
                ctx.moveTo(x, margin);
                ctx.lineTo(x, height - margin);
                ctx.stroke();
            }
        }
    }
    
    // Y-axis gridlines
    if (yLog) {
        const yGridRange = viewYMax - viewYMin;
        let increment = 1;
        if (yGridRange < 2 && zoomLevel > 0.3) {
            increment = 0.2;
        }
        for (let val = Math.floor(viewYMin / increment) * increment; val <= viewYMax; val += increment) {
            if (Math.abs(val - Math.round(val)) > 0.01 || val === Math.round(val)) {
                const y = height - margin - (val - viewYMin) / (viewYMax - viewYMin) * plotHeight;
                if (y >= margin && y <= height - margin) {
                    ctx.beginPath();
                    ctx.moveTo(margin, y);
                    ctx.lineTo(width - margin, y);
                    ctx.stroke();
                }
            }
        }
    } else {
        const numGridLines = Math.max(3, Math.min(20, Math.floor(8 * zoomLevel)));
        const yIncrement = (viewYMax - viewYMin) / numGridLines;
        const yPower = Math.pow(10, Math.floor(Math.log10(yIncrement)));
        const yStep = Math.ceil(yIncrement / yPower) * yPower;
        const yStart = Math.floor(viewYMin / yStep) * yStep;
        for (let val = yStart; val <= viewYMax; val += yStep) {
            const y = height - margin - (val - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            if (y >= margin && y <= height - margin) {
                ctx.beginPath();
                ctx.moveTo(margin, y);
                ctx.lineTo(width - margin, y);
                ctx.stroke();
            }
        }
    }
    
    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw excluded points from past filters (if enabled)
    if (showPastFilters && excludedPoints.size > 0) {
        const excludedColor = isDark ? '#8b5a2b' : '#ff9800';
        ctx.fillStyle = excludedColor;
        for (let idx = 0; idx < currentPoints.length; idx++) {
            if (!excludedPoints.has(idx)) continue;
            
            const point = currentPoints[idx];
            let x, y;
            
            if (xLog) {
                if (point.x <= 0) continue;
                x = margin + (Math.log10(point.x) - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            } else {
                x = margin + (point.x - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            }
            
            if (yLog) {
                if (point.y <= 0) continue;
                y = height - margin - (Math.log10(point.y) - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            } else {
                y = height - margin - (point.y - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            }
            
            if (x >= margin && x <= width - margin && y >= margin && y <= height - margin) {
                ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
            }
        }
    }
    
    // Draw points - adapt color to theme
    const pointColor = isDark ? '#ffffff' : '#000000';
    ctx.fillStyle = pointColor;
    for (let idx = 0; idx < currentPoints.length; idx++) {
        // Skip excluded points if showing past filters
        if (showPastFilters && excludedPoints.has(idx)) continue;
        
        const point = currentPoints[idx];
        let x, y;
        
        if (xLog) {
            if (point.x <= 0) continue;
            x = margin + (Math.log10(point.x) - viewXMin) / (viewXMax - viewXMin) * plotWidth;
        } else {
            x = margin + (point.x - viewXMin) / (viewXMax - viewXMin) * plotWidth;
        }
        
        if (yLog) {
            if (point.y <= 0) continue;
            y = height - margin - (Math.log10(point.y) - viewYMin) / (viewYMax - viewYMin) * plotHeight;
        } else {
            y = height - margin - (point.y - viewYMin) / (viewYMax - viewYMin) * plotHeight;
        }
        
        if (x >= margin && x <= width - margin && y >= margin && y <= height - margin) {
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
    }
    
    // Draw selected points
    if (selectedIndices.length > 0) {
        ctx.fillStyle = '#28a745';
        for (const idx of selectedIndices) {
            const point = currentPoints[idx];
            if (!point) continue;
            
            let x, y;
            if (xLog) {
                if (point.x <= 0) continue;
                x = margin + (Math.log10(point.x) - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            } else {
                x = margin + (point.x - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            }
            
            if (yLog) {
                if (point.y <= 0) continue;
                y = height - margin - (Math.log10(point.y) - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            } else {
                y = height - margin - (point.y - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            }
            
            if (x >= margin && x <= width - margin && y >= margin && y <= height - margin) {
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }
    
    // Draw lasso (lassoPoints are in screen coordinates)
    if (lassoPoints.length > 0) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < lassoPoints.length; i++) {
            const p = lassoPoints[i];
            // p is already in screen coordinates, just use it directly
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        if (lassoPoints.length > 2) {
            ctx.closePath();
        }
        ctx.stroke();
    }
    
    // Draw axis labels using KaTeX
    axisLabelsContainer.innerHTML = '';
    axisLabelsContainer.style.width = `${width}px`;
    axisLabelsContainer.style.height = `${height}px`;
    
    const labelSpacing = 40; // Minimum spacing between labels
    
    // X-axis labels
    if (xLog) {
        const xGridRange = viewXMax - viewXMin;
        let increment = 1;
        if (xGridRange < 2 && zoomLevel > 0.3) {
            increment = 0.2;
        }
        let lastLabelX = -Infinity;
        for (let val = Math.floor(viewXMin / increment) * increment; val <= viewXMax; val += increment) {
            // Always show labels, but format them appropriately
            const x = margin + (val - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            if (x >= margin && x <= width - margin && x - lastLabelX >= labelSpacing) {
                // Format label: show whole numbers without decimals, decimals only when needed
                let labelText;
                const rounded = Math.round(val * 100) / 100; // Round to avoid floating point issues
                if (Math.abs(rounded) < 0.01) {
                    labelText = '1';
                } else if (Math.abs(rounded - 1) < 0.01) {
                    labelText = '10';
                } else {
                    // Check if it's effectively a whole number
                    if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
                        // Whole number
                        labelText = `10^{${Math.round(rounded)}}`;
                    } else {
                        // Decimal - show one decimal place
                        labelText = `10^{${Math.round(rounded * 10) / 10}}`;
                    }
                }
                const labelDiv = document.createElement('div');
                labelDiv.style.position = 'absolute';
                labelDiv.style.left = `${x}px`;
                labelDiv.style.top = `${height - margin + 5}px`;
                labelDiv.style.transform = 'translateX(-50%)';
                labelDiv.style.color = axisColor;
                katex.render(labelText, labelDiv, { throwOnError: false, displayMode: false, fontSize: 12 });
                axisLabelsContainer.appendChild(labelDiv);
                lastLabelX = x;
            }
        }
    } else {
        const numLabels = Math.max(3, Math.min(15, Math.floor(8 * zoomLevel)));
        const xIncrement = (viewXMax - viewXMin) / numLabels;
        const xPower = Math.pow(10, Math.floor(Math.log10(xIncrement)));
        const xStep = Math.ceil(xIncrement / xPower) * xPower;
        const xStart = Math.floor(viewXMin / xStep) * xStep;
        let lastLabelX = -Infinity;
        for (let val = xStart; val <= viewXMax; val += xStep) {
            const x = margin + (val - viewXMin) / (viewXMax - viewXMin) * plotWidth;
            if (x >= margin && x <= width - margin && x - lastLabelX >= labelSpacing) {
                const decimals = xStep < 0.01 ? 3 : xStep < 0.1 ? 2 : xStep < 1 ? 1 : 0;
                const labelText = val.toFixed(decimals);
                const labelDiv = document.createElement('div');
                labelDiv.style.position = 'absolute';
                labelDiv.style.left = `${x}px`;
                labelDiv.style.top = `${height - margin + 5}px`;
                labelDiv.style.transform = 'translateX(-50%)';
                labelDiv.style.color = axisColor;
                katex.render(labelText, labelDiv, { throwOnError: false, displayMode: false, fontSize: 12 });
                axisLabelsContainer.appendChild(labelDiv);
                lastLabelX = x;
            }
        }
    }
    
    // Y-axis labels
    if (yLog) {
        const yGridRange = viewYMax - viewYMin;
        let increment = 1;
        if (yGridRange < 2 && zoomLevel > 0.3) {
            increment = 0.2;
        }
        let lastLabelY = -Infinity;
        for (let val = Math.floor(viewYMin / increment) * increment; val <= viewYMax; val += increment) {
            // Always show labels, but format them appropriately
            const y = height - margin - (val - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            if (y >= margin && y <= height - margin && Math.abs(y - lastLabelY) >= labelSpacing) {
                // Format label: show whole numbers without decimals, decimals only when needed
                let labelText;
                const rounded = Math.round(val * 100) / 100; // Round to avoid floating point issues
                if (Math.abs(rounded) < 0.01) {
                    labelText = '1';
                } else if (Math.abs(rounded - 1) < 0.01) {
                    labelText = '10';
                } else {
                    // Check if it's effectively a whole number
                    if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
                        // Whole number
                        labelText = `10^{${Math.round(rounded)}}`;
                    } else {
                        // Decimal - show one decimal place
                        labelText = `10^{${Math.round(rounded * 10) / 10}}`;
                    }
                }
                const labelDiv = document.createElement('div');
                labelDiv.style.position = 'absolute';
                labelDiv.style.left = `${margin - 30}px`;
                labelDiv.style.top = `${y}px`;
                labelDiv.style.transform = 'translateY(-50%)';
                labelDiv.style.textAlign = 'right';
                labelDiv.style.color = axisColor;
                katex.render(labelText, labelDiv, { throwOnError: false, displayMode: false, fontSize: 12 });
                axisLabelsContainer.appendChild(labelDiv);
                lastLabelY = y;
            }
        }
    } else {
        const numLabels = Math.max(3, Math.min(15, Math.floor(8 * zoomLevel)));
        const yIncrement = (viewYMax - viewYMin) / numLabels;
        const yPower = Math.pow(10, Math.floor(Math.log10(yIncrement)));
        const yStep = Math.ceil(yIncrement / yPower) * yPower;
        const yStart = Math.floor(viewYMin / yStep) * yStep;
        let lastLabelY = -Infinity;
        for (let val = yStart; val <= viewYMax; val += yStep) {
            const y = height - margin - (val - viewYMin) / (viewYMax - viewYMin) * plotHeight;
            if (y >= margin && y <= height - margin && Math.abs(y - lastLabelY) >= labelSpacing) {
                const decimals = yStep < 0.01 ? 3 : yStep < 0.1 ? 2 : yStep < 1 ? 1 : 0;
                const labelText = val.toFixed(decimals);
                const labelDiv = document.createElement('div');
                labelDiv.style.position = 'absolute';
                labelDiv.style.left = `${margin - 30}px`;
                labelDiv.style.top = `${y}px`;
                labelDiv.style.transform = 'translateY(-50%)';
                labelDiv.style.textAlign = 'right';
                labelDiv.style.color = axisColor;
                katex.render(labelText, labelDiv, { throwOnError: false, displayMode: false, fontSize: 12 });
                axisLabelsContainer.appendChild(labelDiv);
                lastLabelY = y;
            }
        }
    }
}

// Convert screen coordinates to data coordinates
function screenToData(screenX, screenY) {
    const dpr = window.devicePixelRatio || 1;
    const margin = 60;
    const width = plotCanvas.width / dpr;
    const height = plotCanvas.height / dpr;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;
    
    const xLog = xAxisLogScale.checked;
    const yLog = yAxisLogScale.checked;
    
    let xData, yData, xMin, xMax, yMin, yMax;
    
    if (xLog) {
        xData = currentPoints.map(p => p.x).filter(x => x > 0);
        if (xData.length === 0) return null;
        xMin = Math.log10(Math.min(...xData));
        xMax = Math.log10(Math.max(...xData));
    } else {
        xData = currentPoints.map(p => p.x);
        xMin = Math.min(...xData);
        xMax = Math.max(...xData);
    }
    
    if (yLog) {
        yData = currentPoints.map(p => p.y).filter(y => y > 0);
        if (yData.length === 0) return null;
        yMin = Math.log10(Math.min(...yData));
        yMax = Math.log10(Math.max(...yData));
    } else {
        yData = currentPoints.map(p => p.y);
        yMin = Math.min(...yData);
        yMax = Math.max(...yData);
    }
    
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const scaledXRange = xRange / zoomLevel;
    const scaledYRange = yRange / zoomLevel;
    const centerX = (xMin + xMax) / 2 + panX * xRange;
    const centerY = (yMin + yMax) / 2 + panY * yRange;
    const viewXMin = centerX - scaledXRange / 2;
    const viewXMax = centerX + scaledXRange / 2;
    const viewYMin = centerY - scaledYRange / 2;
    const viewYMax = centerY + scaledYRange / 2;
    
    // Convert screen coordinates to data coordinates
    const normalizedX = (screenX - margin) / plotWidth;
    const normalizedY = (height - margin - screenY) / plotHeight;
    
    let dataX = viewXMin + normalizedX * (viewXMax - viewXMin);
    let dataY = viewYMin + normalizedY * (viewYMax - viewYMin);
    
    // If log scale, convert back from log space
    if (xLog) {
        dataX = Math.pow(10, dataX);
    }
    if (yLog) {
        dataY = Math.pow(10, dataY);
    }
    
    return { x: dataX, y: dataY };
}

// Mouse event handlers (simplified)
plotCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        plotCanvas.style.cursor = 'move';
        return;
    }
    
    if (e.button === 0) {
        isDrawing = true;
        const rect = plotCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Store screen coordinates for drawing
        lassoPoints = [{ x, y }];
        selectedIndices = [];
        drawPlot();
    }
});

plotCanvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        const rect = plotCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const margin = 60;
        const width = plotCanvas.width / dpr;
        const height = plotCanvas.height / dpr;
        const plotWidth = width - 2 * margin;
        const plotHeight = height - 2 * margin;
        
        const xLog = xAxisLogScale.checked;
        const yLog = yAxisLogScale.checked;
        
        let xData, yData, xMin, xMax, yMin, yMax;
        
        if (xLog) {
            xData = currentPoints.map(p => p.x).filter(x => x > 0);
            if (xData.length === 0) return;
            xMin = Math.log10(Math.min(...xData));
            xMax = Math.log10(Math.max(...xData));
        } else {
            xData = currentPoints.map(p => p.x);
            xMin = Math.min(...xData);
            xMax = Math.max(...xData);
        }
        
        if (yLog) {
            yData = currentPoints.map(p => p.y).filter(y => y > 0);
            if (yData.length === 0) return;
            yMin = Math.log10(Math.min(...yData));
            yMax = Math.log10(Math.max(...yData));
        } else {
            yData = currentPoints.map(p => p.y);
            yMin = Math.min(...yData);
            yMax = Math.max(...yData);
        }
        
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        const scaledXRange = xRange / zoomLevel;
        const scaledYRange = yRange / zoomLevel;
        
        // Calculate pan delta in data space
        const dx = (e.clientX - panStartX) / plotWidth * scaledXRange;
        const dy = (panStartY - e.clientY) / plotHeight * scaledYRange;
        
        panX -= dx / xRange;
        panY -= dy / yRange;
        
        panStartX = e.clientX;
        panStartY = e.clientY;
        drawPlot();
        return;
    }
    
    if (isDrawing) {
        const rect = plotCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lassoPoints.push({ x, y });
        drawPlot();
    }
});

plotCanvas.addEventListener('mouseup', (e) => {
    if (isPanning) {
        isPanning = false;
        plotCanvas.style.cursor = 'crosshair';
        return;
    }
    
    if (isDrawing && e.button === 0) {
        if (lassoPoints.length > 0) {
            lassoPoints.push({ ...lassoPoints[0] });
        }
        isDrawing = false;
        filterPoints();
    }
});

plotCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Wheel zoom
plotCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    if (!currentPoints || currentPoints.length === 0) return;
    
    const rect = plotCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get current data point under mouse
    const dataPoint = screenToData(mouseX, mouseY);
    if (!dataPoint) return;
    
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor));
    
    if (newZoomLevel === zoomLevel) return;
    
    // Calculate new pan to keep the point under mouse fixed
    const xLog = xAxisLogScale.checked;
    const yLog = yAxisLogScale.checked;
    
    let xData, yData, xMin, xMax, yMin, yMax;
    
    if (xLog) {
        xData = currentPoints.map(p => p.x).filter(x => x > 0);
        if (xData.length === 0) return;
        xMin = Math.log10(Math.min(...xData));
        xMax = Math.log10(Math.max(...xData));
    } else {
        xData = currentPoints.map(p => p.x);
        xMin = Math.min(...xData);
        xMax = Math.max(...xData);
    }
    
    if (yLog) {
        yData = currentPoints.map(p => p.y).filter(y => y > 0);
        if (yData.length === 0) return;
        yMin = Math.log10(Math.min(...yData));
        yMax = Math.log10(Math.max(...yData));
    } else {
        yData = currentPoints.map(p => p.y);
        yMin = Math.min(...yData);
        yMax = Math.max(...yData);
    }
    
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    // Convert mouse point to data coordinates
    let mouseDataX, mouseDataY;
    if (xLog) {
        mouseDataX = Math.log10(dataPoint.x);
    } else {
        mouseDataX = dataPoint.x;
    }
    if (yLog) {
        mouseDataY = Math.log10(dataPoint.y);
    } else {
        mouseDataY = dataPoint.y;
    }
    
    // Calculate current view center
    const oldCenterX = (xMin + xMax) / 2 + panX * xRange;
    const oldCenterY = (yMin + yMax) / 2 + panY * yRange;
    const oldScaledXRange = xRange / zoomLevel;
    const oldScaledYRange = yRange / zoomLevel;
    
    // Update zoom
    zoomLevel = newZoomLevel;
    
    // Calculate new view center to keep mouse point fixed
    const newScaledXRange = xRange / zoomLevel;
    const newScaledYRange = yRange / zoomLevel;
    
    // Calculate offset from center
    const offsetX = mouseDataX - oldCenterX;
    const offsetY = mouseDataY - oldCenterY;
    
    // New center keeps the same offset ratio
    const newCenterX = mouseDataX - offsetX * (newScaledXRange / oldScaledXRange);
    const newCenterY = mouseDataY - offsetY * (newScaledYRange / oldScaledYRange);
    
    // Update pan
    panX = (newCenterX - (xMin + xMax) / 2) / xRange;
    panY = (newCenterY - (yMin + yMax) / 2) / yRange;
    
    drawPlot();
});

// Filter points
async function filterPoints() {
    if (lassoPoints.length < 3) {
        selectedIndices = [];
        drawPlot();
        return;
    }
    
    try {
        // Convert screen coordinates to data coordinates
        const dataLassoPoints = lassoPoints.map(p => {
            const dataPoint = screenToData(p.x, p.y);
            return dataPoint || { x: 0, y: 0 };
        }).filter(p => p.x !== 0 || p.y !== 0);
        
        if (dataLassoPoints.length < 3) {
            selectedIndices = [];
            drawPlot();
            return;
        }
        
        const xLog = xAxisLogScale.checked;
        const yLog = yAxisLogScale.checked;
        
        // Transform to log space if needed
        let transformedLasso = dataLassoPoints;
        let transformedPoints = currentPoints;
        
        if (xLog || yLog) {
            transformedLasso = dataLassoPoints.map(p => {
                let x = p.x;
                let y = p.y;
                if (xLog && x > 0) x = Math.log10(x);
                if (yLog && y > 0) y = Math.log10(y);
                return { x, y };
            });
            
            transformedPoints = currentPoints.map(p => {
                let x = p.x;
                let y = p.y;
                if (xLog && x > 0) x = Math.log10(x);
                if (yLog && y > 0) y = Math.log10(y);
                return { x, y };
            });
        }
        
        const result = await invoke('filter_points', {
            polygon: { points: transformedLasso },
            points: transformedPoints
        });
        
        selectedIndices = result.indices;
        drawPlot();
        showStatus(`Selected ${result.count} points`, 'success');
    } catch (error) {
        showStatus(`Error filtering points: ${error}`, 'warning');
        console.error(error);
    }
}

// Confirm selection
confirmBtn.addEventListener('click', async () => {
    if (selectedIndices.length === 0) {
        showStatus('Please select some points first', 'warning');
        return;
    }
    
    if (selectedChannels.length !== 2) {
        showStatus('No channel pair selected', 'warning');
        return;
    }
    
    const channelPair = `${selectedChannels[0]}|${selectedChannels[1]}`;
    
    if (filtersByChannelPair.has(channelPair)) {
        const index = filtersByChannelPair.get(channelPair);
        filterIndices[index] = [...selectedIndices];
    } else {
        filterIndices.push([...selectedIndices]);
        filtersByChannelPair.set(channelPair, filterIndices.length - 1);
    }
    
    showStatus('Filter saved. You can select different channels and create another filter, or export the results.', 'success');
    selectedIndices = [];
    lassoPoints = [];
    updateFilterSummary();
    document.getElementById('existingFilterWarning').style.display = 'none';
    drawPlot();
    
    if (filterIndices.length > 0) {
        exportBtn.disabled = false;
        document.getElementById('exportOptions').classList.remove('hidden');
    }
});

// Clear selection
clearBtn.addEventListener('click', () => {
    lassoPoints = [];
    selectedIndices = [];
    hideStatus();
    drawPlot();
});

// Update filter summary
async function updateFilterSummary() {
    if (filterIndices.length === 0) {
        filterSummary.style.display = 'none';
        excludedPoints.clear();
        return;
    }
    
    try {
        const result = await invoke('intersect_filters', { filters: filterIndices });
        const totalEvents = currentData?.data[currentData.channels[0]]?.length || 0;
        const passing = result.length;
        const excluded = totalEvents - passing;
        
        document.getElementById('filterSummaryText').textContent = 
            `Total events: ${totalEvents.toLocaleString()} | Passing all filters: ${passing.toLocaleString()} (${(passing / totalEvents * 100).toFixed(1)}%) | Excluded: ${excluded.toLocaleString()}`;
        filterSummary.style.display = 'block';
        
        // Update excluded points set for the current plot
        // The result contains global indices from the original data
        // We need to check which of the current plot's points are excluded
        if (currentPoints && currentPoints.length > 0 && currentData) {
            const passingSet = new Set(result);
            excludedPoints.clear();
            
            // Get the total number of events in the original data
            const totalEvents = currentData.data[currentData.channels[0]]?.length || 0;
            
            // For each point in the current plot, check if its global index is excluded
            // Since currentPoints is a subset (for the current channel pair), we need to
            // check if the corresponding global index is in the passing set
            // The indices in result are global indices (0 to totalEvents-1)
            // currentPoints indices correspond to the same global indices
            for (let i = 0; i < currentPoints.length && i < totalEvents; i++) {
                if (!passingSet.has(i)) {
                    excludedPoints.add(i);
                }
            }
        }
    } catch (error) {
        console.error('Error updating filter summary:', error);
        filterSummary.style.display = 'none';
        excludedPoints.clear();
    }
}

// Export data
exportBtn.addEventListener('click', async () => {
    if (!currentData) return;
    
    let indices = [];
    if (filterIndices.length > 0) {
        try {
            indices = await invoke('intersect_filters', { filters: filterIndices });
            if (indices.length === 0) {
                showStatus('No points match all filters', 'warning');
                return;
            }
        } catch (error) {
            showStatus(`Error intersecting filters: ${error}`, 'warning');
            console.error(error);
            return;
        }
    } else if (selectedIndices.length > 0) {
        indices = selectedIndices;
    } else {
        showStatus('No selection to export. Please select some points first.', 'warning');
        return;
    }
    
    try {
        const format = exportFormat.value;
        let extension = '.xlsx';
        if (format === 'csv') {
            extension = '.csv';
        } else if (format === 'parquet') {
            extension = '.parquet.gzip';
        }
        
        const outputPath = await save({
            filters: [{
                name: format === 'csv' ? 'CSV' : format === 'parquet' ? 'Parquet' : 'Excel',
                extensions: [format === 'csv' ? 'csv' : format === 'parquet' ? 'parquet.gzip' : 'xlsx']
            }],
            defaultPath: 'filtered_data' + extension
        });
        
        if (!outputPath) return;
        
        showStatus('Exporting data...', 'info');
        await invoke('export_filtered_data', {
            filePath: currentData.filepath,
            indices,
            outputPath,
            format
        });
        
        showStatus(`Data exported successfully to ${outputPath} (${indices.length} events)`, 'success');
    } catch (error) {
        showStatus(`Export error: ${error}`, 'warning');
        console.error(error);
    }
});

// Theme management
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    if (theme === 'system') {
        theme = getSystemTheme();
    }
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme-preference', theme === getSystemTheme() ? 'system' : theme);
}

function initTheme() {
    const saved = localStorage.getItem('theme-preference') || 'system';
    themeSelect.value = saved;
    setTheme(saved);
    
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (themeSelect.value === 'system') {
                setTheme('system');
            }
        });
    }
}

themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
    if (currentPoints.length > 0) {
        drawPlot();
    }
});

initTheme();

// Reset filter
resetFilterBtn.addEventListener('click', () => {
    if (selectedChannels.length !== 2) return;
    
    const channelPair = `${selectedChannels[0]}|${selectedChannels[1]}`;
    if (filtersByChannelPair.has(channelPair)) {
        const index = filtersByChannelPair.get(channelPair);
        filterIndices.splice(index, 1);
        filtersByChannelPair.delete(channelPair);
        
        // Update indices
        filtersByChannelPair.forEach((idx, key) => {
            if (idx > index) {
                filtersByChannelPair.set(key, idx - 1);
            }
        });
        
        selectedIndices = [];
        lassoPoints = [];
        document.getElementById('existingFilterWarning').style.display = 'none';
        updateFilterSummary();
        drawPlot();
        showStatus('Filter reset. You can now create a new selection.', 'info');
    }
});

// Zoom controls
document.getElementById('zoomInBtn').addEventListener('click', () => {
    zoomLevel = Math.min(10, zoomLevel * 1.5);
    drawPlot();
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
    zoomLevel = Math.max(0.1, zoomLevel / 1.5);
    drawPlot();
});

document.getElementById('resetZoomBtn').addEventListener('click', () => {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    drawPlot();
});

// Scale change handlers
xAxisLogScale.addEventListener('change', () => {
    if (currentPoints.length > 0) {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        drawPlot();
    }
});

yAxisLogScale.addEventListener('change', () => {
    if (currentPoints.length > 0) {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        drawPlot();
    }
});

// Show past filters
showPastFiltersCheckbox.addEventListener('change', async (e) => {
    showPastFilters = e.target.checked;
    if (showPastFilters && filterIndices.length > 0) {
        await updateFilterSummary();
    } else if (!showPastFilters) {
        excludedPoints.clear();
    }
    if (currentPoints.length > 0) {
        drawPlot();
    }
});
