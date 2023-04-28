var HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");

module.exports = env => {
	if (!env) {
		env = {};
	}
	return {
		entry: ['./src/main.sass', "./src/index.tsx"],
		devtool: "source-map",
		mode: "development",
		devServer: {
			historyApiFallback: true,
			static: {
				directory: path.resolve(__dirname, 'assets'),
				publicPath: '/assets'
			}
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".sass"]
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: "ts-loader"
						}
					]
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						"style-loader",
						"@teamsupercell/typings-for-css-modules-loader",
						{
							loader: "css-loader",
							options: {
								modules: true,
							}
						},
						"sass-loader"
					],
				},
			]
		},
		plugins: [
			new HtmlWebpackPlugin({
				base: "/",
				title: "",
			})
		]
	};
};
