require 'sinatra'
require 'erubis'

#templates are just in .
set :views, File.dirname(__FILE__)

get '/' do
  erubis :flowchart
end
