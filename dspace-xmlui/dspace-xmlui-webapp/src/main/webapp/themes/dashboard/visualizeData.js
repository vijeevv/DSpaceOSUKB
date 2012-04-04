/*
 * # Visualize Data
 *
 * Simple script to help visualize data generated by elastic search.
 */

// Firstly we wrap our code in a closure to keep variables local.
(function (context) {

    /*
     * ### Chart Maker
     *
     * Create a helper module called chart maker that allows us to specify and
     * draw charts.
     */
    context.ChartMaker = function() {
      var chartMaker = {};
      // Make a place to store charts we want to draw later.
      chartMaker.charts = {};

      // A shortcut to the google...DataTable function.
      chartMaker.chartData = function () {
        return new google.visualization.DataTable();
      };

      // TODO: Document this code!
      chartMaker.addChart = function (name, chart, data, parent, options) {
          var height = $('#' + parent).height();
          $('#' + parent).height(height + 280);
          $('#' + parent).append("<div style='height:280px; width:750px;' id='"+ name + "'> </div>");
        console.log(parent + " child=" + name);
        this.charts[name] = {chart: new chart(document.getElementById(name)), data: data, options: options};
      };

      chartMaker.drawChart = function(name, globalOptions) {
        if (typeof globalOptions === 'undefined') {
          globalOptions = {};
        }
        var cobj = this.charts[name];
        var data = cobj.data;
        if ('data' in globalOptions) {
          data = globalOptions.data;
        }

        //Merge the Global Options with the local options for the chart
        var combinedOptions = $.extend(globalOptions, cobj.options);
        cobj.chart.draw(data, combinedOptions);
      };

      chartMaker.drawAllCharts = function (options) {
        for (var name in this.charts) {
          this.drawChart(name, options);
        }
      };
      return chartMaker;
    };

    google.load('visualization', '1',{'packages':['annotatedtimeline', 'geochart', 'corechart']});
    google.setOnLoadCallback(function () {
      jQuery(document).ready(function ($) {
        var chartMaker = new ChartMaker();

        // Get data from elastic response
        var elasticJSON = $.parseJSON($('#aspect_dashboard_ElasticSearchStatsViewer_field_response').val());

          function elasticDataHelper(entries, name, includeTotal, main_chart_data, keyField, valueField, textChartDiv, chartType, options) {
              var total = 0;
              var dataValue = [];
              $.each(entries, function(index, entry) {
                  if(includeTotal) {
                      total += entry.count;
                      if(chartType == 'LineChart') {
                          dataValue.push([new Date(entry[keyField]), entry[valueField], total]);
                      } else {
                          dataValue.push([entry[keyField], entry[valueField], total]);
                      }

                  } else {
                      if(chartType == 'LineChart') {
                        dataValue.push([new Date(entry[keyField]), entry[valueField]]);
                      } else {
                          dataValue.push([entry[keyField], entry[valueField]]);
                      }
                  }
              });

             //We have our chartData object passed (with defaults set) now.
              main_chart_data.addRows(dataValue);

              chartMaker.addChart(name, google.visualization[chartType], main_chart_data, textChartDiv, options);
          }

          function chartDataHelper(type, textKey, textValue, includeTotal, textTotal) {
              // Put data from Elastic response into a ChartData object
              var main_chart_data = chartMaker.chartData();

              if(type == 'date') {
                  main_chart_data.addColumn('date', textKey);
              } else {
                  main_chart_data.addColumn('string', textKey);
              }


              main_chart_data.addColumn('number', textValue);
              if(includeTotal) {
                  main_chart_data.addColumn('number', textTotal);
              }

              return main_chart_data;
          }

          var options = { title : 'Views per DSpaceObject Type' };

          // Use a helper to do all the work to create our downloads charts.
          // There is one parent div chart_div, and we will append child divs for each chart.
          var chartDataTotal = chartDataHelper('date', 'Date', 'Items Added', true, 'Total Items');
          elasticDataHelper(elasticJSON.facets.monthly_downloads.entries, 'downloadsWithTotal', true, chartDataTotal, 'time', 'count', 'chart_div', 'LineChart', options);

          var chartDataNoTotal = chartDataHelper('date', 'Date', 'Items Added', false, 'Total Items');
          elasticDataHelper(elasticJSON.facets.monthly_downloads.entries, 'downloadsMonthly', false, chartDataNoTotal, 'time', 'count', 'chart_div', 'LineChart', options);

          //TODO Map looks better at size $("#" + mapDivId).height(500).width(780);
          var chartDataGeo = chartDataHelper('string', 'Country', 'Views', false, 'Total');
          elasticDataHelper(elasticJSON.facets.top_countries.terms, 'topCountries', false, chartDataGeo, 'term', 'count', 'chart_div', 'GeoChart', options);

          var chartDataPie = chartDataHelper('string', 'Type', 'Views', false, '');
          elasticDataHelper(elasticJSON.facets.top_types.terms, 'topTypes', false, chartDataPie, 'term', 'count', 'chart_div', 'PieChart', options);

          // Resize the chart_div parent to fit its contents.
          var totalChildHeight = 0;
          $('#chart_div').children().each(function() {
              totalChildHeight += $(this).height();
          });
          $('#chart_div').height(totalChildHeight);

        chartMaker.drawAllCharts();
      });
    });
})(this);
